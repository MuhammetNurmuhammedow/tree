.PHONY: up down restart logs migrate migrate-down test lint build

# Docker
up:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

# Database migrations (uses golang-migrate inside container)
migrate:
	docker compose exec backend migrate -path /app/migrations -database "postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)" up

migrate-down:
	docker compose exec backend migrate -path /app/migrations -database "postgres://$(DB_USER):$(DB_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)?sslmode=$(DB_SSLMODE)" down 1

# Backend
build:
	cd backend && go build -o bin/api ./cmd/api

test:
	cd backend && go test ./... -v

lint:
	cd backend && golangci-lint run

# Dev shortcut: run everything locally without Docker
dev-db:
	docker compose up postgres -d

dev-backend:
	cd backend && APP_ENV=development go run ./cmd/api

dev-frontend:
	cd frontend && npm run dev

