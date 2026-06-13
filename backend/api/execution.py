from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from execution.manager import execution_manager

router = APIRouter()

class ApprovalRequest(BaseModel):
    approval_id: str
    approved: bool

@router.post("/approve")
async def approve_execution(request: ApprovalRequest):
    success = execution_manager.submit_approval(request.approval_id, request.approved)
    if not success:
        raise HTTPException(status_code=404, detail="Approval request not found or expired.")
    return {"status": "success", "approved": request.approved}
