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


### Compose: Container Resource Limitations
Configure limits in `docker-compose.yml` to prevent Out-Of-Memory events: backend containers should limit memory usage to 2GB, frontend to 512MB.

### Compose: Service Restart Policies
Services use `restart: unless-stopped` with active healthchecks checking database responsiveness every 30 seconds before starting dependent containers.

### Compose: Log Rotation Drivers
Specify standard json-file logging limits: max-size set to `10m` and max-file count set to `3` to protect local disks from log overflows.

### Network: Reverse Proxy Routing Setup
An Nginx routing reverse proxy is recommended to map port 80 requests to frontend (5173) and `/api/*` endpoints to the FastAPI backend (8000).

### Security: Let's Encrypt SSL Certificates
To enable HTTPS in production deployments, configure Certbot certificates and map key credentials in the web server configurations.

### System: Systemd Autostart Configuration
Create a systemd unit configuration file `afk-runtime.service` mapping executable directories to launch the docker compose process during system boot cycles.

### Storage: Persistent Storage Bindings
Always mount persistent volumes for postgres data (`/var/lib/postgresql/data`) and mongodb directories to prevent session data loss during container upgrades.