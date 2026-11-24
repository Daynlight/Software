#!/bin/bash
set -euo pipefail

# 1. Automatically resolve the directory where this script is located (expected: PRI/)
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-dev.yaml}"

# 2. Load environment variables from .env
if [ -f "$PROJECT_DIR/.env" ]; then
    export $(grep -v '^#' "$PROJECT_DIR/.env" | xargs)
else
    echo "Error: .env file not found in $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR" || exit 1

echo "=== Database Statistics: $DB_DATABASE ($COMPOSE_FILE) ==="

# 3. Query database metrics inside the PostgreSQL container
docker compose -f "$COMPOSE_FILE" exec -T db psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_DATABASE" <<'EOF'
\echo '\n--- Database Size ---'
SELECT
    current_database() AS database,
    pg_size_pretty(pg_database_size(current_database())) AS total_size;

\echo '\n--- Table Row Counts & Sizes ---'
SELECT
    table_name,
    row_count,
    pg_size_pretty(pg_total_relation_size(table_name::regclass)) AS total_size
FROM (
    SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
    UNION ALL
    SELECT 'groups', COUNT(*) FROM groups
    UNION ALL
    SELECT 'groups_members', COUNT(*) FROM groups_members
) t;

\echo '\n--- Groups Breakdown ---'
SELECT
    COUNT(*) FILTER (WHERE "endedAt" IS NULL) AS active_groups,
    COUNT(*) FILTER (WHERE "endedAt" IS NOT NULL) AS ended_groups
FROM groups;

\echo '\n--- Active Connections ---'
SELECT
    state,
    COUNT(*) AS connections
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state;
EOF