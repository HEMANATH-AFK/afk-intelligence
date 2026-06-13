import json
import uuid
import time
from fastapi import APIRouter, Request, Depends, HTTPException
from sse_starlette.sse import EventSourceResponse
from pydantic import BaseModel
from src.shared.redis_pubsub import subscribe_events
from src.workers.tasks import orchestrate_workflow_task
from src.core.database import get_db
from src.modules.orchestration.domain.entities import WorkflowModel

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    model: str = "llama3"

@router.post("/workflows")
async def create_workflow(body: ChatRequest, db=Depends(get_db)):
    try:
        workflow_uuid = uuid.uuid4()
        workflow_id = str(workflow_uuid)
        
        # Persist initial workflow state using real uuid.UUID
        new_workflow = WorkflowModel(id=workflow_uuid, request_message=body.message, status="PENDING")
        db.add(new_workflow)
        await db.commit()
        
        # Try firing Celery, otherwise trigger asyncio task immediately
        from src.shared.redis_pubsub import use_redis
        from src.modules.orchestration.loop import execute_workflow_loop
        import asyncio
        
        if use_redis:
            try:
                orchestrate_workflow_task.delay(workflow_id, body.message)
                print(f"[OBSERVABILITY] Workflow enqueued in Celery worker: {workflow_id}")
            except Exception as cel_err:
                print(f"[OBSERVABILITY] Celery enqueue failed: {cel_err}. Running directly via asyncio task.")
                asyncio.create_task(execute_workflow_loop(workflow_id, body.message))
        else:
            print(f"[OBSERVABILITY] Redis/Celery is offline. Launching dynamic cognitive loop via local asyncio task.")
            asyncio.create_task(execute_workflow_loop(workflow_id, body.message))
        
        print(f"[OBSERVABILITY] Workflow created: {workflow_id} with goal: '{body.message}'")
        return {"workflow_id": workflow_id, "status": "PENDING"}
    except Exception as e:
        print(f"[OBSERVABILITY] Failed to create workflow: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/workflows/{workflow_id}/stream")
async def stream_workflow(request: Request, workflow_id: str):
    print(f"[OBSERVABILITY] SSE stream connection opened for workflow: {workflow_id}")
    
    async def event_generator():
        pubsub = await subscribe_events(workflow_id)
        print(f"[OBSERVABILITY] Redis subscription started for channel workflow:{workflow_id}")
        
        last_heartbeat = time.time()
        try:
            while True:
                # Handle client disconnect
                if await request.is_disconnected():
                    print(f"[OBSERVABILITY] Client disconnected from workflow stream: {workflow_id}")
                    break
                
                # Fetch message from PubSub
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    try:
                        data = json.loads(message["data"])
                        print(f"[OBSERVABILITY] Redis event consumed for {workflow_id}: {data.get('event_type')}")
                        
                        yield {
                            "event": data.get("event_type", "info"),
                            "data": json.dumps(data)
                        }
                        
                        # Graceful finalization criteria
                        if data.get("event_type") == "system_state" and "STORE_MEMORY" in data.get("message", ""):
                            print(f"[OBSERVABILITY] Workflow completed successfully for: {workflow_id}")
                            yield {
                                "event": "workflow_completed",
                                "data": json.dumps({"workflow_id": workflow_id, "status": "COMPLETED"})
                            }
                            break
                    except Exception as parse_err:
                        print(f"[OBSERVABILITY] Error parsing Redis payload: {str(parse_err)}")
                
                # HEARTBEAT KEEPALIVE check (every 15 seconds)
                now = time.time()
                if now - last_heartbeat > 15.0:
                    yield {
                        "event": "ping",
                        "data": "keepalive"
                    }
                    last_heartbeat = now
                    
        except Exception as e:
            print(f"[OBSERVABILITY] SSE stream failure for workflow {workflow_id}: {str(e)}")
            yield {
                "event": "workflow_failed",
                "data": json.dumps({"workflow_id": workflow_id, "status": "FAILED", "error": str(e)})
            }
        finally:
            await pubsub.unsubscribe()
            await pubsub.close()
            print(f"[OBSERVABILITY] Redis subscription clean up completed for workflow: {workflow_id}")
            
    return EventSourceResponse(event_generator())
