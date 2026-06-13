.PHONY: up down build logs reset

up:
	docker compose up -d

build:
	docker compose up --build -d

down:
	docker compose down

logs:
	docker compose logs -f

reset:
	docker compose down -v
	docker compose up --build -d
