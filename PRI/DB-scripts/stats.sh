#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-dev.yaml}"
ENV_FILE="$PROJECT_DIR/.env"

read_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-
}

DB_USER="$(read_env DB_USER)"
DB_PASSWORD="$(read_env DB_PASSWORD)"
DB_DATABASE="$(read_env DB_DATABASE)"
export DB_USER DB_PASSWORD DB_DATABASE

cd "$PROJECT_DIR"

docker compose -f "$COMPOSE_FILE" exec -T db_dev psql \
  -v ON_ERROR_STOP=1 \
  -U "$DB_USER" \
  -d "$DB_DATABASE" <<'SQL'
SELECT current_database() AS database, pg_size_pretty(pg_database_size(current_database())) AS total_size;

SELECT 'users' AS table_name, COUNT(*) AS rows FROM users
UNION ALL SELECT 'groups', COUNT(*) FROM groups
UNION ALL SELECT 'group_members', COUNT(*) FROM group_members
UNION ALL SELECT 'join_requests', COUNT(*) FROM join_requests;

SELECT g.name, g.member_count, COUNT(jr.id) FILTER (WHERE jr.status = 'PENDING') AS pending_requests
FROM groups g
LEFT JOIN join_requests jr ON jr.group_id = g.id
GROUP BY g.id, g.name, g.member_count
ORDER BY g.name;
SQL
