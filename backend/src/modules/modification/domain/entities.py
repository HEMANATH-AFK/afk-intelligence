from sqlalchemy import Column, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.dialects.postgresql import UUID
import uuid
import datetime
from src.core.database import Base

class ModificationPlanModel(Base):
    __tablename__ = "modification_plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id", ondelete="CASCADE"), index=True)
    status = Column(String, default="PLANNING_MODIFICATION") # PLANNING_MODIFICATION, PROPOSING_PATCH, AWAITING_APPROVAL, APPROVED, REJECTED
    plan_data = Column(JSON, default=dict)
    impact_data = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class PatchProposalModel(Base):
    __tablename__ = "patch_proposals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("modification_plans.id", ondelete="CASCADE"), index=True)
    filepath = Column(String, nullable=False)
    diff = Column(Text, nullable=False)
    confidence = Column(JSON, default=dict) # {"score": float, "risk_notes": []}
    applied = Column(String, default="PENDING") # PENDING, SUCCESS, FAILED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
