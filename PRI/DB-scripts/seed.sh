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

echo "Cleaning and seeding database: $DB_DATABASE (using $COMPOSE_FILE)..."

cd "$PROJECT_DIR" || exit 1

# 3. Execute SQL script inside the PostgreSQL container
docker compose -f "$COMPOSE_FILE" exec -T db psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_DATABASE" <<'EOF'
BEGIN;

-- Clear all tables and cascade foreign key constraints
TRUNCATE TABLE groups_members, groups, users CASCADE;

-- Insert test users (1 faculty/promotor with NULL student_number, 5 students)
INSERT INTO users (usos_id, first_name, last_name, student_number, email) VALUES
    (10001, 'Jan', 'Kowalski', NULL, 'jan.kowalski@put.poznan.pl'),
    (20001, 'Anna', 'Nowak', 151201, 'anna.nowak@student.put.poznan.pl'),
    (20002, 'Piotr', 'Wiśniewski', 151202, 'piotr.wisniewski@student.put.poznan.pl'),
    (20003, 'Katarzyna', 'Wójcik', 151203, 'katarzyna.wojcik@student.put.poznan.pl'),
    (20004, 'Michał', 'Kamiński', 151204, 'michal.kaminski@student.put.poznan.pl'),
    (20005, 'Zofia', 'Lewandowska', 151205, 'zofia.lewandowska@student.put.poznan.pl');

-- Insert test groups (2 active groups, 1 ended/archived group)
INSERT INTO groups (id, name, description, "endedAt") VALUES
    ('11111111-1111-1111-1111-111111111111', 'PRI Team Alpha', 'Web application for managing university project groups.', NULL),
    ('22222222-2222-2222-2222-222222222222', 'AI Research Squad', 'Machine learning pipeline for automated grading.', NULL),
    ('33333333-3333-3333-3333-333333333333', 'Legacy Systems 2025', 'Archived project from the previous semester.', NOW() - INTERVAL '30 days');

-- Insert group memberships (note: user_id references users.usos_id)
INSERT INTO groups_members (group_id, user_id, role, "leftAt") VALUES
    -- PRI Team Alpha
    ('11111111-1111-1111-1111-111111111111', 10001, 'promotor', NULL),
    ('11111111-1111-1111-1111-111111111111', 20001, 'owner', NULL),
    ('11111111-1111-1111-1111-111111111111', 20002, 'admin', NULL),
    ('11111111-1111-1111-1111-111111111111', 20003, 'member', NULL),
    ('11111111-1111-1111-1111-111111111111', 20004, 'member', NOW() - INTERVAL '5 days'),

    -- AI Research Squad
    ('22222222-2222-2222-2222-222222222222', 10001, 'promotor', NULL),
    ('22222222-2222-2222-2222-222222222222', 20004, 'owner', NULL),
    ('22222222-2222-2222-2222-222222222222', 20005, 'member', NULL),

    -- Legacy Systems 2025
    ('33333333-3333-3333-3333-333333333333', 20001, 'owner', NULL),
    ('33333333-3333-3333-3333-333333333333', 20005, 'member', NULL);

COMMIT;
EOF

echo "Database successfully cleared and seeded!"