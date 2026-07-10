# Database Integration & Configuration

This document outlines the database connectivity and configurations settings.

## 1. Database Connection (`mongodb.py`)

The application integrates with MongoDB using the `motor` asynchronous client driver (`AsyncIOMotorClient`).
- **Startup Connection Hook:** Database connection is initialized asynchronously on FastAPI startup events.
- **Shutdown Disconnect Hook:** Closes active connection pools when the web server shuts down.

---

## 2. Configuration Settings (`settings.py`)

Settings are managed via a Pydantic `BaseSettings` schema that parses environment variables from the `.env` file automatically:

- `MONGO_URI`: The MongoDB connection string (defaults to `mongodb://localhost:27017`).
- `DB_NAME`: The database namespace to store sessions (defaults to `afk_intelligence`).
- `OLLAMA_URL`: Local endpoint routing LLM requests (defaults to `http://localhost:11434`).
- `DEFAULT_MODEL`: The default inference model loaded for chat orchestration (defaults to `gemma:2b`).


### Indexes: MongoDB Session Collections
Indexes are configured on the `messages` collection for fields `session_id` and `timestamp` to ensure swift lookup speeds during chat history loading.

### Relational: PostgreSQL SQLAlchemy Connections
The SQLAlchemy engine uses an asyncpg driver. Connection pool limits are set to 20 connections max with an idle recycle timeout of 3600 seconds.

### Migrations: Database Schema Operations
Execute database migrations using Alembic commands. Apply pending changes inside the container via: `poetry run alembic upgrade head`.

### Cache: Redis Schema Caching Layer
Redis caches parsed AST directory metadata of workspace scanning. Cache entries expire automatically after a 10-minute TTL or on file change notifications.