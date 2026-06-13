import logging
import asyncio
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from src.core.config import settings
from src.core.database import init_db, AsyncSessionLocal, engine, get_db
from src.modules.chat.presentation import router as chat_router
from src.modules.modification.presentation import router as mod_router
from src.modules.orchestration.presentation import router as orch_router
from src.shared.redis_pubsub import redis_client
from src.shared.ollama_client import ollama_client
from src.modules.orchestration.domain.entities import WorkflowModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat_router, prefix=f"{settings.API_V1_STR}/chat", tags=["chat"])
app.include_router(mod_router, prefix=f"{settings.API_V1_STR}/modification", tags=["modification"])
app.include_router(orch_router, prefix=f"{settings.API_V1_STR}/orchestration", tags=["orchestration"])

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Cognitive Runtime...")
    
    # 1. Initialize DB
    await init_db()
    
    # 2. Validate DB connection
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        logger.info("PostgreSQL connected successfully.")
    except Exception as e:
        logger.critical(f"Failed to connect to PostgreSQL: {e}")
        raise e
        
    # 3. Validate Redis
    try:
        from src.shared.redis_pubsub import get_redis_client
        client = await get_redis_client()
        if client:
            logger.info("Redis connected successfully.")
        else:
            logger.warning("Redis is offline. Continuing with high-reliability In-Memory PubSub.")
    except Exception as e:
        logger.warning(f"Failed to connect to Redis: {e}. Continuing with high-reliability In-Memory PubSub.")
        
    # 4. Validate Ollama
    try:
        # Check if ollama is reachable by listing models
        await ollama_client.list()
        logger.info("Ollama connected successfully.")
    except Exception as e:
        logger.critical(f"Failed to connect to Ollama. Make sure the container is running and models are pulled. Error: {e}")
        # Note: In a strict environment we might raise here, but for local dev we can just warn
        logger.warning("Continuing startup despite Ollama connection failure.")

@app.get("/health")
async def health_check():
    health_status = {"status": "ok", "version": "0.1.0", "dependencies": {}}
    
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        health_status["dependencies"]["postgres"] = "ok"
    except Exception:
        health_status["dependencies"]["postgres"] = "error"
        health_status["status"] = "degraded"
        
    try:
        await redis_client.ping()
        health_status["dependencies"]["redis"] = "ok"
    except Exception:
        health_status["dependencies"]["redis"] = "error"
        health_status["status"] = "degraded"
        
    try:
        await ollama_client.list()
        health_status["dependencies"]["ollama"] = "ok"
    except Exception:
        health_status["dependencies"]["ollama"] = "error"
        health_status["status"] = "degraded"
        
    if health_status["status"] != "ok":
        raise HTTPException(status_code=503, detail=health_status)
    return health_status

@app.post(f"{settings.API_V1_STR}/context/index")
async def trigger_indexing(db=Depends(get_db)):
    from src.modules.context.services.embeddings import EmbeddingPipeline
    
    # We run the indexing pipeline asynchronously to not block the API
    pipeline = EmbeddingPipeline(db, "system_indexer")
    asyncio.create_task(pipeline.run_indexing())
    return {"status": "indexing_started", "message": "Workspace indexing started in the background. Check SSE stream for updates."}

@app.get(f"{settings.API_V1_STR}/debug/workflow/{{workflow_id}}")
async def get_workflow_debug(workflow_id: str):
    async with AsyncSessionLocal() as session:
        wf = await session.get(WorkflowModel, workflow_id)
        if not wf:
            raise HTTPException(status_code=404, detail="Workflow not found")
            
        return {
            "workflow_id": wf.id,
            "status": wf.status,
            "request_message": wf.request_message,
            "state_data": wf.state_data,
            "created_at": wf.created_at,
            "updated_at": wf.updated_at
        }
