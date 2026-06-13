from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.core.database import get_db
from src.modules.orchestration.domain.entities import SessionModel, WorkflowModel
from src.modules.orchestration.services.session import SessionMemoryService
from src.modules.orchestration.services.replay import WorkflowReplayService
from src.workers.tasks import orchestrate_workflow_task

router = APIRouter()

@router.get("/session/{session_id}/history")
async def get_session_history(session_id: str, db: AsyncSession = Depends(get_db)):
    import uuid
    db_session = await db.get(SessionModel, uuid.UUID(session_id))
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {
        "session_id": str(db_session.id),
        "prompt_history": db_session.prompt_history,
        "summaries": db_session.summaries,
        "created_at": db_session.created_at
    }

@router.get("/workflow/{workflow_id}/replay")
async def replay_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    replay_service = WorkflowReplayService(db)
    trace = await replay_service.get_replay_trace(workflow_id)
    if "error" in trace:
        raise HTTPException(status_code=404, detail=trace["error"])
    return trace

@router.post("/workflow/{workflow_id}/resume")
async def resume_workflow(workflow_id: str, db: AsyncSession = Depends(get_db)):
    wf = await db.get(WorkflowModel, workflow_id)
    if not wf:
        raise HTTPException(status_code=404, detail="Workflow not found")
        
    if wf.status not in ["PAUSED", "RESUMABLE", "FAILED"]:
        raise HTTPException(status_code=400, detail=f"Cannot resume a workflow in state {wf.status}")
        
    wf.status = "RESUMABLE"
    await db.commit()
    
    # Restart the background task
    orchestrate_workflow_task.delay(str(wf.id), wf.request_message)
    return {"status": "RESUMED", "message": "Workflow restarted in background."}
