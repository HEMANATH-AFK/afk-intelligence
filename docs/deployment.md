# Deployment, Docker & Makefile Reference

This document covers operational controls, container orchestrations, and make scripts.

## 1. Container Topology (`docker-compose.yml`)

The platform runs isolated service layers using Docker Compose:

* **`db`**: Serves a local MongoDB instance.
* **`backend`**: Builds the FastAPI app container using `backend/Dockerfile` and exposes port `8000`.
* **`frontend`**: Builds the React production server or dev container exposing port `5173`.

---

## 2. Makefile Command Reference

The root `Makefile` automates repetitive workflows for local operators.

### Commands

* **`make setup`**
  - Installs requirements, sets up the virtual env, and bootstraps configurations.
  - Command: `python -m venv venv && ./venv/bin/pip install -r backend/requirements.txt`

* **`make run-backend`**
  - Directly launches FastAPI locally using Uvicorn.
  - Command: `cd backend && uvicorn main:app --reload --port 8000`

* **`make run-frontend`**
  - Directly launches Vite local development dev-server.
  - Command: `cd frontend && npm run dev`

* **`make build`**
  - Triggers Docker Compose build commands for all container configurations.
  - Command: `docker compose up --build`
