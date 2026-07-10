# Getting Started with AFK-Intelligence

Welcome to **AFK-Intelligence**—a fully free, local-first cognitive runtime designed to run agentic AI workflows on your own hardware without cloud dependencies or operational fees.

## Prerequisites

Before starting, ensure your local development system meets the following requirements:

- **Operating System:** Windows, macOS, or Linux.
- **Docker & Docker Compose:** Installed and running (essential for hosting PostgreSQL, Redis, and optionally MongoDB/Ollama).
- **Ollama:** Installed locally (recommended) or configured to run inside a container.
- **Hardware Resources:** 
  - Minimum: 8GB RAM (16GB RAM recommended for hosting LLMs).
  - Storage: ~10GB of free space for local models (e.g., Gemma, Llama3, Nomic Embeddings).

---

## Step 1: Install & Set Up Ollama

Ollama serves as the local LLM inference engine. 

1. Download Ollama from the [official website](https://ollama.com).
2. Install the application for your operating system.
3. Start the Ollama background service.
4. Pull the default models used by the AFK-Intelligence platform:
   ```bash
   ollama run gemma:2b
   ollama run nomic-embed-text
   ```

---

## Step 2: Configure Environment Variables

Create a `.env` file in the root directory (or update the existing one) to specify port bindings, database connection strings, and LLM preferences:

```env
MONGO_URI=mongodb://localhost:27017
DB_NAME=afk_intelligence
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=gemma:2b
```

---

## Step 3: Run the Application

Start the local platform using the provided Makefile orchestrations:

```bash
make build
# or run compose directly:
docker compose up --build
```

This starts:
- **MongoDB:** Database for conversation sessions, workspace files, and execution state metadata.
- **FastAPI Backend:** Serving the agentic API router on `http://localhost:8000`.
- **React Frontend:** Standard web client accessible on `http://localhost:5173`.

---

## Step 4: Verify System Health

Test the backend health check endpoint to confirm correct database and agent setup:

```bash
curl http://localhost:8000/
```

Expected response:
```json
{
  "message": "AFK Intelligence API is running",
  "status": "online"
}
```


### Troubleshooting: Custom Ollama Host URL
If Ollama is running on a different port or server, set the `OLLAMA_URL` environment variable to point to the correct endpoint (e.g., `http://192.168.1.50:11434`).

### Resource Tip: Ollama Memory Allocation
To run Llama3 or larger models efficiently, ensure at least 8GB of VRAM is available. You can optimize memory usage by stopping background applications that consume GPU resources.

### Troubleshooting: Docker Network Conflicts
If port `8000` or `5173` is already in use, modify the port mappings in your `docker-compose.yml` or check for active processes with `netstat -aon` on Windows.