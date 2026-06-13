from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.chat import router as chat_router
from api.workspace import router as workspace_router
from api.auth import router as auth_router
from api.execution import router as execution_router
from database.mongodb import mongodb

app = FastAPI(
    title="AFK Intelligence API",
    description="Local AI Operating System backend",
    version="1.0.0"
)

@app.on_event("startup")
async def startup_event():
    await mongodb.connect()

@app.on_event("shutdown")
async def shutdown_event():
    await mongodb.disconnect()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix="/api/chat", tags=["chat"])
app.include_router(workspace_router, prefix="/api/workspace", tags=["workspace"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(execution_router, prefix="/api/execution", tags=["execution"])

@app.get("/")
async def root():
    return {"message": "AFK Intelligence API is running", "status": "online"}
