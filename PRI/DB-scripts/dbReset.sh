#!/bin/bash
set -euo pipefail

# 1. Resolve the parent directory (PRI/) assuming this script is inside PRI/DB-scripts/
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-dev.yaml}"

# 2. Safety check: prevent accidental production wipe
if [[ "$COMPOSE_FILE" == *"prod"* ]]; then
    echo "Error: Refusing to run db-reset on a production compose file ($COMPOSE_FILE)."
    exit 1
fi

# 3. Ask for user confirmation
read -r -p "WARNING: This will stop containers and permanently delete all database volumes ($COMPOSE_FILE). Continue? [y/N] " response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

cd "$PROJECT_DIR" || exit 1

# 4. Stop services and remove volumes (including postgres_data)
echo "Stopping containers and removing volumes..."
docker compose -f "$COMPOSE_FILE" down -v

# 5. Start a fresh database container and wait until its healthcheck passes
echo "Starting fresh PostgreSQL container..."
docker compose -f "$COMPOSE_FILE" up -d --wait db

echo "Database has been reset and is healthy!"
