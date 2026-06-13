from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.modules.orchestration.domain.entities import SessionModel, WorkflowModel
from src.shared.ollama_client import generate_completion
import uuid

class SessionMemoryService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_or_create_session(self, session_id: str = None) -> SessionModel:
        if session_id:
            db_session = await self.session.get(SessionModel, uuid.UUID(session_id) if isinstance(session_id, str) else session_id)
            if db_session:
                return db_session
                
        new_session = SessionModel()
        self.session.add(new_session)
        await self.session.commit()
        return new_session

    async def add_workflow_to_session(self, session_id: str, workflow_id: str, prompt: str):
        db_session = await self.get_or_create_session(session_id)
        
        # Update prompt history
        history = list(db_session.prompt_history or [])
        history.append(prompt)
        db_session.prompt_history = history
        
        # Link workflow
        stmt = select(WorkflowModel).where(WorkflowModel.id == workflow_id)
        wf = (await self.session.execute(stmt)).scalar_one_or_none()
        if wf:
            wf.session_id = db_session.id
            
        await self.session.commit()
        
    async def compress_memory(self, session_id: str):
        db_session = await self.get_or_create_session(session_id)
        prompts = db_session.prompt_history or []
        
        if not prompts:
            return
            
        # Lightweight summarization using Ollama to avoid context overload
        prompt_list = "\n".join([f"- {p}" for p in prompts])
        summary_prompt = f"Summarize the user's intent evolution from these sequential prompts:\n{prompt_list}"
        
        try:
            summary = await generate_completion(
                prompt=summary_prompt,
                model="llama3"
            )
            db_session.summaries = {
                **db_session.summaries,
                "intent_summary": summary.strip()
            }
            await self.session.commit()
        except Exception as e:
            print(f"Failed to compress session memory: {e}")
