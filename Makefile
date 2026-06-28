# Makefile for orchestrating local development environment services via Docker Compose
DOCKER_COMPOSE ?= docker compose

.PHONY: help up down build rebuild logs logs-backend logs-frontend logs-worker logs-db logs-redis logs-ollama reset status stats restart shell-backend shell-frontend shell-db backend-shell frontend-shell lint test-backend validate lint-frontend ollama-setup prune

help: ## Display this help screen
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-18s\033[0m %s\n", $$1, $$2}'

up: ## Start the platform containers in the background
	$(DOCKER_COMPOSE) up -d

build: ## Build and start the platform containers
	$(DOCKER_COMPOSE) up --build -d

rebuild: ## Build platform container images without using cache
	$(DOCKER_COMPOSE) build --no-cache

down: ## Stop and remove the platform containers
	$(DOCKER_COMPOSE) down

logs: ## Follow all container logs
	$(DOCKER_COMPOSE) logs -f

logs-backend: ## Follow backend service logs
	$(DOCKER_COMPOSE) logs -f backend

logs-frontend: ## Follow frontend service logs
	$(DOCKER_COMPOSE) logs -f frontend

logs-worker: ## Follow worker service logs
	$(DOCKER_COMPOSE) logs -f worker

logs-db: ## Follow postgres database service logs
	$(DOCKER_COMPOSE) logs -f postgres

logs-redis: ## Follow redis service logs
	$(DOCKER_COMPOSE) logs -f redis

logs-ollama: ## Follow ollama service logs
	$(DOCKER_COMPOSE) logs -f ollama

status: ## Show status of running containers
	$(DOCKER_COMPOSE) ps

stats: ## Show container resource usage statistics
	$(DOCKER_COMPOSE) stats

restart: ## Restart platform containers
	$(DOCKER_COMPOSE) restart

shell-backend: ## Open an interactive shell inside the backend container
	$(DOCKER_COMPOSE) exec backend bash

shell-frontend: ## Open an interactive shell inside the frontend container
	$(DOCKER_COMPOSE) exec frontend sh

shell-db: ## Open interactive psql shell inside the postgres container
	$(DOCKER_COMPOSE) exec postgres psql -U afk -d afk_db

backend-shell: shell-backend ## Alias for shell-backend

frontend-shell: shell-frontend ## Alias for shell-frontend

lint: ## Run local pre-commit hooks on all files
	pre-commit run --all-files

test-backend: ## Run unit tests inside the backend container
	$(DOCKER_COMPOSE) exec backend poetry run pytest

validate: lint test-backend ## Run both lint and test-backend targets

lint-frontend: ## Run ESLint inside the frontend container
	$(DOCKER_COMPOSE) exec frontend npm run lint

ollama-setup: ## Pull default LLM and embedding models in Ollama
	$(DOCKER_COMPOSE) exec ollama ollama pull llama3
	$(DOCKER_COMPOSE) exec ollama ollama pull nomic-embed-text

prune: ## Remove unused Docker containers, networks, images, and volumes
	docker system prune -a --volumes -f

reset: ## Reset the platform (removes volumes, rebuilds, and restarts)
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up --build -d
