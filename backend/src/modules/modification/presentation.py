from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.core.database import get_db
from src.modules.modification.domain.entities import ModificationPlanModel, PatchProposalModel
from src.modules.orchestration.domain.entities import WorkflowModel
from src.modules.context.services.assembler import ContextAssembler
from src.modules.modification.services.planner import ModificationPlanner
from src.modules.modification.services.impact import ImpactAnalysisService
from src.modules.modification.services.patch import PatchProposalEngine
from src.modules.modification.services.sandbox import SafeWriteSandbox
from src.modules.modification.services.validation import ValidationExecutor
from src.shared.redis_pubsub import publish_event
from pydantic import BaseModel

router = APIRouter()

class ModificationRequest(BaseModel):
    workflow_id: str
    goal: str

@router.post("/plan")
async def create_modification_plan(body: ModificationRequest, db: AsyncSession = Depends(get_db)):
    # 1. Verify workflow
    wf = await db.get(WorkflowModel, body.workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    await publish_event(body.workflow_id, "PLANNING_MODIFICATION", "impact_analysis_started", "Synthesizing codebase context...")
    
    # 2. Assemble context
    assembler = ContextAssembler(db, body.workflow_id)
    context = await assembler.assemble_context(body.goal, top_k=3)
    
    # 3. Create Plan
    planner = ModificationPlanner(body.workflow_id)
    plan = await planner.generate_plan(body.goal, context)
    
    # 4. Generate Impact and Patches
    impact_service = ImpactAnalysisService(db, body.workflow_id)
    patch_engine = PatchProposalEngine(body.workflow_id)
    
    steps_with_patches = []
    total_impact = []
    
    for step in plan.get("steps", []):
        # Determine current content safely
        from src.modules.tools.registry import read_file
        current_content = await read_file(step["file"])
        if current_content.startswith("Error:"):
            current_content = ""
            
        # Get simulated patch
        patch = await patch_engine.propose_patch(step["file"], current_content, step["reasoning"])
        steps_with_patches.append(patch)
        
        # Analyze impact
        impact = await impact_service.analyze_impact(step["file"])
        total_impact.append(impact)
        
    # 5. Persist to Database
    mod_plan = ModificationPlanModel(
        workflow_id=body.workflow_id,
        status="AWAITING_APPROVAL",
        plan_data=plan,
        impact_data=total_impact
    )
    db.add(mod_plan)
    await db.flush()
    
    for patch in steps_with_patches:
        prop = PatchProposalModel(
            plan_id=mod_plan.id,
            filepath=patch["file"],
            diff=patch["diff"],
            confidence={"score": patch["confidence"], "risk_notes": patch["risk_notes"]}
        )
        db.add(prop)
        
    await db.commit()
    
    await publish_event(body.workflow_id, "AWAITING_APPROVAL", "approval_required", f"Plan generated. {len(steps_with_patches)} patch proposals awaiting review.", payload={"plan_id": str(mod_plan.id)})
    
    return {
        "plan_id": mod_plan.id,
        "workflow_id": body.workflow_id,
        "status": mod_plan.status,
        "plan": plan,
        "impact": total_impact,
        "patches": steps_with_patches
    }

@router.post("/approve/{plan_id}")
async def approve_and_apply(plan_id: str, db: AsyncSession = Depends(get_db)):
    plan = await db.get(ModificationPlanModel, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    if plan.status != "AWAITING_APPROVAL":
        raise HTTPException(status_code=400, detail=f"Cannot approve plan with status {plan.status}")
        
    # Set status
    plan.status = "APPROVED"
    await db.commit()
    
    # Load patches
    stmt = select(PatchProposalModel).where(PatchProposalModel.plan_id == plan.id)
    patches = (await db.execute(stmt)).scalars().all()
    
    sandbox = SafeWriteSandbox(str(plan.workflow_id))
    validator = ValidationExecutor(str(plan.workflow_id))
    
    applied_successes = []
    
    for patch in patches:
        # Applying simulation diff: in full engine we merge the diff.
        # For local MVP sandbox safety, we write the updated block/synthesized new file.
        # Since diff is simulated, we'll simulate applying it or write it safely.
        # Let's perform sandbox validation syntax check on simulated changes.
        write_result = await sandbox.apply_safe_write(patch.filepath, patch.diff)
        
        if write_result["status"] == "success":
            # Run syntax compilation validation
            validation = await validator.validate_syntax(patch.filepath)
            
            if validation["status"] == "failed":
                # Rollback!
                if write_result.get("backup_path"):
                    await sandbox.rollback(patch.filepath, write_result["backup_path"])
                patch.applied = "FAILED"
                plan.status = "REJECTED"
                await db.commit()
                raise HTTPException(status_code=500, detail=f"Safety compilation validation failed for {patch.filepath}. Rollback applied.")
            else:
                patch.applied = "SUCCESS"
                applied_successes.append(patch.filepath)
        else:
            patch.applied = "FAILED"
            plan.status = "REJECTED"
            await db.commit()
            raise HTTPException(status_code=500, detail=f"Writing patch to sandbox failed: {write_result.get('error')}")
            
    await db.commit()
    return {"status": "SUCCESS", "applied_files": applied_successes}

@router.post("/reject/{plan_id}")
async def reject_plan(plan_id: str, db: AsyncSession = Depends(get_db)):
    plan = await db.get(ModificationPlanModel, plan_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
        
    plan.status = "REJECTED"
    await db.commit()
    await publish_event(str(plan.workflow_id), "REJECTED", "workflow_rejected", "Repository modification plan rejected by human operator.")
    return {"status": "REJECTED"}
