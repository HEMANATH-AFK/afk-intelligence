# Makefile for orchestrating local development environment services via Docker Compose
.PHONY: help up down build logs reset

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

reset: ## Reset the platform (removes volumes, rebuilds, and restarts)
	docker compose down -v
	docker compose up --build -d
