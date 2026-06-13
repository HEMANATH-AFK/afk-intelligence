from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime
from database.mongodb import db_client
import uuid

class TaskStatus(str, Enum):
    PENDING = "PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    WAITING_APPROVAL = "WAITING_APPROVAL"

class WorkflowStep(Dict):
    id: str
    description: str
    status: TaskStatus
    result: Optional[str]
    tool_call: Optional[Dict[str, Any]]

class WorkflowManager:
    def __init__(self):
        self.collection_name = "workflows"

    async def create_workflow(self, session_id: str, goal: str, steps: List[Dict[str, Any]]) -> str:
        workflow_id = str(uuid.uuid4())
        
        entry = {
            "workflow_id": workflow_id,
            "session_id": session_id,
            "goal": goal,
            "status": TaskStatus.ACTIVE,
            "current_step_index": 0,
            "steps": [
                {
                    "id": str(uuid.uuid4()),
                    "description": step["description"],
                    "status": TaskStatus.PENDING,
                    "tool_call": step.get("tool_call"),
                    "result": None
                } for step in steps
            ],
            "created_at": datetime.utcnow().isoformat()
        }
        
        if db_client.db is not None:
            await db_client.db[self.collection_name].insert_one(entry)
        
        return workflow_id

    async def get_workflow(self, workflow_id: str) -> Optional[Dict[str, Any]]:
        if db_client.db is not None:
            return await db_client.db[self.collection_name].find_one({"workflow_id": workflow_id})
        return None

    async def update_step(self, workflow_id: str, step_id: str, status: TaskStatus, result: str = None):
        if db_client.db is not None:
            await db_client.db[self.collection_name].update_one(
                {"workflow_id": workflow_id, "steps.id": step_id},
                {"$set": {"steps.$.status": status, "steps.$.result": result}}
            )

    async def advance_workflow(self, workflow_id: str):
        workflow = await self.get_workflow(workflow_id)
        if not workflow: return
        
        current_idx = workflow["current_step_index"]
        steps = workflow["steps"]
        
        if current_idx < len(steps):
            await db_client.db[self.collection_name].update_one(
                {"workflow_id": workflow_id},
                {"$set": {"current_step_index": current_idx + 1}}
            )

workflow_manager = WorkflowManager()
