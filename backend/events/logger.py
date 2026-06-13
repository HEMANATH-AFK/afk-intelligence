import logging
import json
from datetime import datetime
from pydantic import BaseModel, Field
from enum import Enum

logger = logging.getLogger(__name__)

class EventType(str, Enum):
    TOKEN = "token"
    THINKING = "thinking"
    TOOL_CALL = "tool_call"
    TOOL_RESULT = "tool_result"
    SYSTEM_STATE = "system_state"
    TELEMETRY = "telemetry"

class SSEEvent(BaseModel):
    event_type: EventType
    message: str
    session_id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: dict = Field(default_factory=dict)

    def to_json(self) -> str:
        # FastAPI StreamingResponse yields strings, which get chunked over the wire
        data = {
            "event": self.event_type.value,
            "message": self.message,
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat(),
            "payload": self.payload
        }
        return json.dumps(data) + "\n"

class EventLogger:
    def __init__(self):
        self.history = []

    def log_event(self, event: SSEEvent):
        self.history.append(event)
        logger.info(f"[{event.event_type.value.upper()}] {event.message}")

event_logger = EventLogger()
