from datetime import datetime
from database.mongodb import mongodb
from pydantic import BaseModel, Field
from typing import List, Optional

class MemoryEntry(BaseModel):
    session_id: str
    memory_type: str  # 'conversation', 'workspace_summary', 'insight'
    content: str
    metadata: dict = Field(default_factory=dict)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MemoryManager:
    @property
    def collection(self):
        return mongodb.db["memories"]

    async def add_memory(self, session_id: str, memory_type: str, content: str, metadata: dict = None):
        if metadata is None:
            metadata = {}
            
        entry = MemoryEntry(
            session_id=session_id,
            memory_type=memory_type,
            content=content,
            metadata=metadata
        )
        await self.collection.insert_one(entry.dict())
        return entry

    async def retrieve_memories(self, session_id: str, limit: int = 10) -> List[dict]:
        cursor = self.collection.find({"session_id": session_id}).sort("timestamp", -1).limit(limit)
        memories = await cursor.to_list(length=limit)
        return memories

    async def get_workspace_context(self, project_path: str) -> Optional[dict]:
        # Retrieve the latest workspace summary for a given path
        memory = await self.collection.find_one(
            {"memory_type": "workspace_summary", "metadata.path": project_path},
            sort=[("timestamp", -1)]
        )
        return memory

memory_manager = MemoryManager()
