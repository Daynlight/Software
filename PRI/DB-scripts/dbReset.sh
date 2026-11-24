#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-dev.yaml}"

if [[ "$COMPOSE_FILE" == *"prod"* ]]; then
  echo "Refusing to reset a production compose file: $COMPOSE_FILE"
  exit 1
fi

read -r -p "This will remove all containers and database volumes. Continue? [y/N] " response
if [[ ! "$response" =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

cd "$PROJECT_DIR"
docker compose -f "$COMPOSE_FILE" down -v
docker compose -f "$COMPOSE_FILE" up -d --wait db_dev
echo "Database volume was reset and db_dev is healthy."
