from sqlalchemy.ext.asyncio import AsyncSession
from src.modules.orchestration.domain.entities import AuditLogModel
import logging

logger = logging.getLogger(__name__)

class AuditLogService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def log_event(self, workflow_id: str, event_type: str, message: str, payload: dict = None) -> AuditLogModel:
        """
        Creates an immutable audit logging entry tracking the timeline of AI decisions and changes.
        """
        import uuid
        wf_uuid = uuid.UUID(workflow_id) if isinstance(workflow_id, str) else workflow_id
        
        log_entry = AuditLogModel(
            workflow_id=wf_uuid,
            event_type=event_type,
            message=message,
            payload=payload or {}
        )
        self.session.add(log_entry)
        await self.session.commit()
        
        logger.info(f"Audit Log [{event_type}] for Workflow {workflow_id}: {message}")
        return log_entry
