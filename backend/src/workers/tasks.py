from src.workers.celery_app import celery_app
import asyncio

# Need a sync wrapper since Celery is fundamentally sync
def run_async(coro):
    return asyncio.get_event_loop().run_until_complete(coro)

@celery_app.task(bind=True, name="orchestrate_workflow")
def orchestrate_workflow_task(self, workflow_id: str, message: str):
    # This will call the actual planner agent async loop
    from src.modules.orchestration.loop import execute_workflow_loop
    return run_async(execute_workflow_loop(workflow_id, message))
