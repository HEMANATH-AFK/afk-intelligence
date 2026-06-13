import asyncio
import logging
from typing import Any, Dict
from src.modules.tools.registry import registry
from src.modules.orchestration.agents.planner import TaskDefinition
from src.shared.redis_pubsub import publish_event

logger = logging.getLogger(__name__)

class ExecutorRuntime:
    def __init__(self, workflow_id: str):
        self.workflow_id = workflow_id
        self.tool_timeout_seconds = 30.0

    async def execute_tasks(self, tasks: list[TaskDefinition]) -> list[Dict[str, Any]]:
        results = []
        
        for task in tasks:
            logger.info(f"Workflow {self.workflow_id} executing task {task.id}: {task.type}")
            await publish_event(
                self.workflow_id, 
                "EXECUTING",
                "tool_execution_started", 
                f"Executing {task.type}...", 
                payload={"tool": task.type, "args": task.args, "id": task.id}
            )
            
            try:
                # Add timeout protection to individual tool execution
                result = await asyncio.wait_for(
                    registry.execute(task.type, **task.args),
                    timeout=self.tool_timeout_seconds
                )
                
                output = {
                    "task_id": task.id,
                    "tool": task.type,
                    "status": "success",
                    "result": result
                }
                
                await publish_event(
                    self.workflow_id, 
                    "EXECUTING",
                    "tool_execution_completed", 
                    f"Task {task.id} complete.", 
                    payload=output
                )
                
            except asyncio.TimeoutError:
                error_msg = f"Task {task.id} ({task.type}) timed out after {self.tool_timeout_seconds}s"
                logger.warning(f"Workflow {self.workflow_id}: {error_msg}")
                output = {
                    "task_id": task.id,
                    "tool": task.type,
                    "status": "failed",
                    "error": error_msg
                }
                await publish_event(
                    self.workflow_id, 
                    "EXECUTING",
                    "tool_execution_failed", 
                    error_msg, 
                    payload=output
                )
            except Exception as e:
                logger.error(f"Workflow {self.workflow_id} task {task.id} failed: {e}", exc_info=True)
                output = {
                    "task_id": task.id,
                    "tool": task.type,
                    "status": "failed",
                    "error": str(e)
                }
                await publish_event(
                    self.workflow_id, 
                    "EXECUTING",
                    "tool_execution_failed", 
                    f"Task {task.id} failed: {e}", 
                    payload=output
                )
                
            results.append(output)
            
        return results
