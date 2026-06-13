import asyncio
import logging
import time
from src.core.database import AsyncSessionLocal
from src.modules.orchestration.domain.entities import WorkflowModel
from src.shared.redis_pubsub import publish_event
from src.modules.orchestration.services.audit import AuditLogService
from src.modules.orchestration.services.reliability import ReliabilityEngine

from src.modules.orchestration.agents.planner import PlannerAgent
from src.modules.orchestration.agents.executor import ExecutorRuntime
from src.modules.orchestration.agents.reflection import ReflectionAgent

logger = logging.getLogger(__name__)
MODEL_NAME = "llama3"
MAX_TASKS = 10
MAX_PLANNING_RETRIES = 2

async def _update_state(workflow_id: str, status: str, state_data: dict = None):
    async with AsyncSessionLocal() as session:
        wf = await session.get(WorkflowModel, workflow_id)
        if wf:
            wf.status = status
            if state_data:
                wf.state_data = {**wf.state_data, **state_data}
            await session.commit()
            
            # Log transition to Audit Log
            audit_service = AuditLogService(session)
            await audit_service.log_event(
                workflow_id=workflow_id,
                event_type="state_transition",
                message=f"Transitioned to state: {status}",
                payload=state_data or {}
            )
            
    await publish_event(workflow_id, status, "system_state", f"STAGE: {status}")

async def execute_workflow_loop(workflow_id: str, message: str, session_id: str = None):
    """
    End-to-End Core AI Orchestration Loop with Session Memory & Reliability Scoring.
    """
    start_time = time.time()
    
    try:
        logger.info(f"Workflow {workflow_id} started: {message}")
        await _update_state(workflow_id, "PENDING", {"request": message})
        await publish_event(workflow_id, "PENDING", "token", f"### COGNITIVE ANALYSIS INITIATED\n\nOperator requested: `{message}`\n\n")
        
        # 0.2 Link Session
        if session_id:
            async with AsyncSessionLocal() as session:
                from src.modules.orchestration.services.session import SessionMemoryService
                session_service = SessionMemoryService(session)
                await session_service.add_workflow_to_session(session_id, workflow_id, message)
        
        # 0.5 CONTEXT RETRIEVAL PHASE
        await _update_state(workflow_id, "RETRIEVING")
        from src.modules.context.services.assembler import ContextAssembler
        async with AsyncSessionLocal() as session:
            assembler = ContextAssembler(session, workflow_id)
            context = await assembler.assemble_context(message, top_k=5)
            
        enhanced_message = f"User Request: {message}\n\n=== RETRIEVED REPOSITORY CONTEXT ===\n{context}\n==================================\n\nBased on this context and the request, plan the execution steps. Cite files you use."
        await publish_event(workflow_id, "RETRIEVING", "context_assembled", "Repository context assembled and injected into prompt.")

        # 1. PLANNING PHASE
        await _update_state(workflow_id, "PLANNING")
        await publish_event(workflow_id, "PLANNING", "planning_started", "Analyzing request and retrieved context...")
        
        planner = PlannerAgent(model_name=MODEL_NAME)
        plan = None
        
        # Retry logic for planner
        for attempt in range(MAX_PLANNING_RETRIES):
            plan = await planner.plan(enhanced_message)
            if plan.goal != "Could not parse planner intent, defaulting to reflection.":
                break
            await publish_event(workflow_id, "PLANNING", "warning", f"Planner retry {attempt+1}/{MAX_PLANNING_RETRIES} due to parse error.")
            
        await publish_event(workflow_id, "PLANNING", "planner_raw_output", "Planner generated raw output", payload=plan.model_dump())
        
        if len(plan.tasks) > MAX_TASKS:
            raise ValueError(f"Planner proposed {len(plan.tasks)} tasks, exceeding the maximum of {MAX_TASKS}.")

        await _update_state(workflow_id, "PLANNING", {"plan": plan.model_dump()})
        await publish_event(workflow_id, "PLANNING", "planning_completed", "Plan parsed successfully.", payload=plan.model_dump())
        
        if plan.requires_tools:
            steps = [{"id": t.id, "description": f"Use {t.type}", "status": "PENDING"} for t in plan.tasks]
            await publish_event(workflow_id, "PLANNING", "telemetry", "Workflow Plan", payload={"workflow_id": workflow_id, "steps": steps})
        
        # 2. EXECUTION PHASE
        execution_results = []
        if plan.requires_tools and plan.tasks:
            await _update_state(workflow_id, "EXECUTING")
            executor = ExecutorRuntime(workflow_id)
            execution_results = await executor.execute_tasks(plan.tasks)
            await _update_state(workflow_id, "EXECUTING", {"execution_results": execution_results})
        
        # 3. REFLECTION PHASE
        await _update_state(workflow_id, "REFLECTING")
        await publish_event(workflow_id, "REFLECTING", "reflection_started", "Synthesizing execution results...")
        
        reflector = ReflectionAgent(model_name=MODEL_NAME)
        reflection = await reflector.reflect(message, plan.goal, execution_results)
        
        await _update_state(workflow_id, "REFLECTING", {"reflection": reflection.model_dump()})
        await publish_event(workflow_id, "REFLECTING", "reflection_completed", "Reflection complete.", payload=reflection.model_dump())
        
        # Stream Final Answer
        await publish_event(workflow_id, "REFLECTING", "token", f"**Final Response:**\n{reflection.final_response}\n\n")
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        # 3.5 RELIABILITY SCORING
        async with AsyncSessionLocal() as session:
            reliability_engine = ReliabilityEngine(session)
            reliability_report = await reliability_engine.calculate_reliability(workflow_id)
            
        await publish_event(workflow_id, "REFLECTING", "reliability_calculated", "Reliability calculated.", payload=reliability_report)
        
        if reflection.success:
            await publish_event(workflow_id, "COMPLETED", "workflow_completed", f"Goal achieved in {duration_ms}ms.")
            await _update_state(workflow_id, "COMPLETED", {"duration_ms": duration_ms})
            logger.info(f"Workflow {workflow_id} completed successfully in {duration_ms}ms")
        else:
            await publish_event(workflow_id, "FAILED", "workflow_failed", f"Goal not achieved. Missing info: {reflection.missing_information}")
            await _update_state(workflow_id, "FAILED", {"duration_ms": duration_ms, "missing_information": reflection.missing_information})
            logger.warning(f"Workflow {workflow_id} failed logically in {duration_ms}ms. Missing: {reflection.missing_information}")
            
    except Exception as e:
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Workflow {workflow_id} crashed: {e}", exc_info=True)
        await publish_event(workflow_id, "FAILED", "workflow_failed", f"Critical Orchestration Error: {str(e)}")
        await _update_state(workflow_id, "FAILED", {"error": str(e), "duration_ms": duration_ms})
    finally:
        await publish_event(workflow_id, "COMPLETED", "system_state", "STAGE: STORE_MEMORY")
