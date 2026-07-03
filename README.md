# AFK-Intelligence 

Fully Free Local-First Cognitive Runtime. 

## Stack
- **Backend:** FastAPI, Celery, SQLAlchemy
- **Data/Messaging:** PostgreSQL (with pgvector), Redis (Pub/Sub broker)
- **AI Engine:** Ollama (Local LLM)
- **Frontend:** React + Vite

## Local Quickstart

### 1. Prerequisites
- Docker & Docker Compose
- Ollama installed locally (or via Docker as configured)
- At least 16GB RAM recommended.

### 2. Pull Required Models
If you are running Ollama outside of Docker, make sure to pull the base models:
```bash
ollama run llama3
ollama run nomic-embed-text
```
*(If running Ollama strictly inside the provided docker-compose container, you will need to exec into it to pull the models: `docker exec -it <container_name> ollama run llama3`)*

### 3. Start the Platform
```bash
make build
# or 
docker compose up --build
```
This will automatically:
1. Boot PostgreSQL, Redis, and Ollama.
2. Run database initializations (creating tables automatically).
3. Start the FastAPI backend at `http://localhost:8000`.
4. Start the Celery worker for AI orchestration tasks.
5. Start the React frontend at `http://localhost:5173`.

### 4. Health & Debugging
Verify the system dependencies:
```bash
curl http://localhost:8000/health
```

Debug a specific workflow execution:
```bash
curl http://localhost:8000/api/v1/debug/workflow/{uuid}
```

### 5. Architectural Philosophy
This project purposefully avoids cloud infrastructure lock-in (no AWS, no Kubernetes). The competitive edge is in **cognitive orchestration**, **developer UX**, and **execution safety**, not distributed microservices. All LLM inferences are kept locally via Ollama to guarantee privacy and $0/month operational costs.

## Themes & UI Styling
AFK features a dynamic, fully functional design system with theme-aware custom properties that support both dark and light modes out of the box:
- **Dark Themes:** Cyber-Neon (Default), Amethyst (Purple), Aurora Polar (Emerald), Space Slate (Slate Gray).
- **Light Themes:** Nordic Light (Clean Indigo/Slate), Cyber Light (High-Contrast Rosy/Indigo).

### Key Features
- **Glassmorphism:** Styled via `.glass-panel` helper classes.
- **Theme-Aware Selections & Scrollbars:** Highlight and scrolling components automatically adjust theme accents.
- **Form Inputs Legibility:** Focus rings and placeholders transition smoothly.

## Documentation Hub

Explore detailed documentation files for each system layer of the AFK-Intelligence application:

1. [Getting Started Guide](file:///docs/getting_started.md) — Local prerequisites, installation steps, and health verification.
2. [High-Level System Architecture](file:///docs/architecture.md) — System boundaries, topology, and runtime communication flow.
3. [Multi-Agent Orchestrator](file:///docs/agents.md) — Persona configurations and workflow state machine.
4. [Intent & Reflection Engine](file:///docs/intent_reflection.md) — Intent classification rules and output validation.
5. [Workspace Scanning & Retrieval](file:///docs/workspace.md) — File crawler indexing, AST parser, chunking, and embeddings.
6. [Code Execution Safety](file:///docs/execution.md) — Safe terminal runners, risk classifiers, and manual approvals.
7. [Database & Settings Configuration](file:///docs/database.md) — MongoDB connections and environment settings.
8. [API Endpoints Reference](file:///docs/api.md) — FastAPI HTTP endpoints and payload models.
9. [Frontend & Styling Systems](file:///docs/frontend.md) — React client directory structure and theme configs.
10. [Build & Deployment Tools](file:///docs/deployment.md) — Docker-Compose container setups and Makefile target references.


