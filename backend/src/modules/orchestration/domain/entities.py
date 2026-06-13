from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from src.core.database import Base

def utc_now():
    return datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

class SessionModel(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    repository_path = Column(String, default="default")
    prompt_history = Column(JSON, default=list) # List of prompts
    summaries = Column(JSON, default=dict) # {"planner_summary": "...", "reflection_summary": "..."}
    created_at = Column(DateTime, default=utc_now)

class WorkflowModel(Base):
    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), nullable=True)
    status = Column(String, default="PENDING") # PENDING, PLANNING, EXECUTING, REFLECTING, COMPLETED, FAILED, PAUSED, RESUMABLE, REPLAYING
    request_message = Column(String, nullable=False)
    state_data = Column(JSON, default=dict) # Traces: plan, execution_results, reflection, reliability_score, etc.
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

class AuditLogModel(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), index=True)
    event_type = Column(String, nullable=False) # state_transition, patch_proposal, approval, rejection, safe_write, rollback
    message = Column(Text, nullable=False)
    payload = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=utc_now)
