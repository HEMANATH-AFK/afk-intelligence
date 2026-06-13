from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class AuthRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
async def login(request: AuthRequest):
    return {"token": "afk-intelligence-mock-token", "user": {"email": request.email}}

@router.post("/register")
async def register(request: AuthRequest):
    return {"status": "success", "user": {"email": request.email}}
