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

