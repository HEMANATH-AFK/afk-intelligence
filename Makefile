# Makefile for orchestrating local development environment services via Docker Compose
.PHONY: help up down build logs logs-backend logs-frontend logs-worker reset status stats restart shell-backend shell-frontend shell-db lint test-backend lint-frontend ollama-setup

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Start the platform containers in the background
	docker compose up -d

build: ## Build and start the platform containers
	docker compose up --build -d

down: ## Stop and remove the platform containers
	docker compose down

logs: ## Follow all container logs
	docker compose logs -f

logs-backend: ## Follow backend service logs
	docker compose logs -f backend

logs-frontend: ## Follow frontend service logs
	docker compose logs -f frontend

logs-worker: ## Follow worker service logs
	docker compose logs -f worker

status: ## Show status of running containers
	docker compose ps

stats: ## Show container resource usage statistics
	docker compose stats

restart: ## Restart platform containers
	docker compose restart

shell-backend: ## Open an interactive shell inside the backend container
	docker compose exec backend bash

shell-frontend: ## Open an interactive shell inside the frontend container
	docker compose exec frontend sh

shell-db: ## Open interactive psql shell inside the postgres container
	docker compose exec postgres psql -U afk -d afk_db

lint: ## Run local pre-commit hooks on all files
	pre-commit run --all-files

test-backend: ## Run unit tests inside the backend container
	docker compose exec backend poetry run pytest

lint-frontend: ## Run ESLint inside the frontend container
	docker compose exec frontend npm run lint

ollama-setup: ## Pull default LLM and embedding models in Ollama
	docker compose exec ollama ollama pull llama3
	docker compose exec ollama ollama pull nomic-embed-text

reset: ## Reset the platform (removes volumes, rebuilds, and restarts)
	docker compose down -v
	docker compose up --build -d
