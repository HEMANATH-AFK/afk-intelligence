from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.modules.orchestration.domain.entities import WorkflowModel, AuditLogModel
from src.modules.modification.domain.entities import ModificationPlanModel, PatchProposalModel

class WorkflowReplayService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_replay_trace(self, workflow_id: str) -> dict:
        """
        Assemble the complete chronological timeline and artifacts of an execution.
        """
        wf = await self.session.get(WorkflowModel, workflow_id)
        if not wf:
            return {"error": "Workflow not found"}
            
        state_data = wf.state_data or {}
        
        # Load associated patch proposals
        stmt_plan = select(ModificationPlanModel).where(ModificationPlanModel.workflow_id == workflow_id)
        mod_plan = (await self.session.execute(stmt_plan)).scalar_one_or_none()
        
        patches_list = []
        if mod_plan:
            stmt_patches = select(PatchProposalModel).where(PatchProposalModel.plan_id == mod_plan.id)
            patches = (await self.session.execute(stmt_patches)).scalars().all()
            patches_list = [{
                "filepath": p.filepath,
                "diff": p.diff,
                "confidence": p.confidence,
                "applied": p.applied
            } for p in patches]
            
        # Load chronological audit logs
        stmt_audit = select(AuditLogModel).where(AuditLogModel.workflow_id == workflow_id).order_by(AuditLogModel.timestamp)
        audits = (await self.session.execute(stmt_audit)).scalars().all()
        audit_trail = [{
            "event_type": a.event_type,
            "message": a.message,
            "payload": a.payload,
            "timestamp": a.timestamp.isoformat()
        } for a in audits]
        
        return {
            "workflow_id": str(wf.id),
            "status": wf.status,
            "request": wf.request_message,
            "planner_output": state_data.get("plan"),
            "execution_results": state_data.get("execution_results"),
            "reflection": state_data.get("reflection"),
            "reliability": state_data.get("reliability"),
            "patches": patches_list,
            "audit_trail": audit_trail,
            "created_at": wf.created_at.isoformat()
        }
