from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agents.orchestrator import orchestrator
import uuid

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    model: str = "gemma:2b"
    session_id: str = "default_session"

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    try:
        if not request.session_id:
            request.session_id = str(uuid.uuid4())
            
        return StreamingResponse(
            orchestrator.stream_orchestrated_response(request.session_id, request.message, request.model),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
