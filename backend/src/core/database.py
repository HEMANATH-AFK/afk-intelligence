import os
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from .config import settings

logger = logging.getLogger(__name__)

DATABASE_URL = settings.async_database_url

try:
    engine = create_async_engine(
        DATABASE_URL,
        echo=False,
        future=True
    )
except Exception:
    sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "afk_local.db")
    DATABASE_URL = f"sqlite+aiosqlite:///{sqlite_path}"
    engine = create_async_engine(DATABASE_URL, echo=False, future=True)
    logger.info(f"[OBSERVABILITY] SQLite database engine created: {sqlite_path}")

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

async def init_db():
    global engine, AsyncSessionLocal
    try:
        from sqlalchemy import text
        
        # Test connection first. If it fails, dynamically switch engine to SQLite
        try:
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception as conn_err:
            logger.warning(f"[OBSERVABILITY] PostgreSQL connection failed: {conn_err}. Switching dynamically to SQLite fallback.")
            sqlite_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "afk_local.db")
            DATABASE_URL = f"sqlite+aiosqlite:///{sqlite_path}"
            engine = create_async_engine(DATABASE_URL, echo=False, future=True)
            AsyncSessionLocal = async_sessionmaker(
                bind=engine,
                autocommit=False,
                autoflush=False,
                expire_on_commit=False
            )
            
        async with engine.begin() as conn:
            if "sqlite" not in str(engine.url):
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"[OBSERVABILITY] Database initialized successfully on URL: {engine.url}")
    except Exception as e:
        logger.error(f"[OBSERVABILITY] Failed to initialize database: {e}")
        raise e
