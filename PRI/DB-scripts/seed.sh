#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose-dev.yaml}"
ENV_FILE="$PROJECT_DIR/.env"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE"
  exit 1
fi

read_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-
}

DB_USER="$(read_env DB_USER)"
DB_PASSWORD="$(read_env DB_PASSWORD)"
DB_DATABASE="$(read_env DB_DATABASE)"
export DB_USER DB_PASSWORD DB_DATABASE

cd "$PROJECT_DIR"
docker compose -f "$COMPOSE_FILE" up -d --wait db_dev backend_dev

docker compose -f "$COMPOSE_FILE" exec -T db_dev psql \
  -v ON_ERROR_STOP=1 \
  -U "$DB_USER" \
  -d "$DB_DATABASE" <<'SQL'
BEGIN;

TRUNCATE TABLE join_requests, group_members, groups, users RESTART IDENTITY CASCADE;

INSERT INTO users (id, usos_id, first_name, last_name, student_number, email, role) VALUES
  ('10000000-0000-4000-8000-000000000001', 581385, 'Ruslan', 'Trytsetskyi', NULL, NULL, 'STUDENT'),
  ('10000000-0000-4000-8000-000000000002', 20001, 'Anna', 'Nowak', '151201', 'anna.nowak@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000003', 20002, 'Piotr', 'Wiśniewski', '151202', 'piotr.wisniewski@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000004', 20003, 'Katarzyna', 'Wójcik', '151203', 'katarzyna.wojcik@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000005', 20004, 'Michał', 'Kamiński', '151204', 'michal.kaminski@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000006', 20005, 'Zofia', 'Lewandowska', '151205', 'zofia.lewandowska@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000007', 20006, 'Tomasz', 'Zieliński', '151206', 'tomasz.zielinski@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000008', 20007, 'Julia', 'Szymańska', '151207', 'julia.szymanska@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000009', 20008, 'Mateusz', 'Dąbrowski', '151208', 'mateusz.dabrowski@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000010', 20009, 'Aleksandra', 'Kaczmarek', '151209', 'aleksandra.kaczmarek@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000011', 20010, 'Jakub', 'Mazur', '151210', 'jakub.mazur@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000012', 20011, 'Natalia', 'Piotrowska', '151211', 'natalia.piotrowska@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000013', 20012, 'Kacper', 'Grabski', '151212', 'kacper.grabski@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000014', 20013, 'Weronika', 'Pawlak', '151213', 'weronika.pawlak@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000015', 20014, 'Bartosz', 'Michalski', '151214', 'bartosz.michalski@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000016', 20016, 'Ola', 'Kaczmarek', '151216', 'ola.kaczmarek@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000017', 20017, 'Kacper', 'Mazur', '151217', 'kacper.mazur@student.amu.edu.pl', 'STUDENT'),
  ('10000000-0000-4000-8000-000000000018', 20018, 'Igor', 'Adamczyk', '151218', 'igor.adamczyk@student.amu.edu.pl', 'STUDENT');

INSERT INTO groups (id, name, description, leader_id, member_count) VALUES
  ('11111111-1111-4111-8111-111111111111', 'PRI Team Alpha', 'Aplikacja webowa do organizacji grup projektowych i zgłoszeń do promotorów.', '10000000-0000-4000-8000-000000000001', 5),
  ('22222222-2222-4222-8222-222222222222', 'AI Research Squad', 'Pipeline uczenia maszynowego do automatycznej oceny projektów.', '10000000-0000-4000-8000-000000000006', 3),
  ('33333333-3333-4333-8333-333333333333', 'Green Campus', 'System monitorowania zużycia energii i wody na kampusie.', '10000000-0000-4000-8000-000000000010', 6),
  ('44444444-4444-4444-8444-444444444444', 'Game Jam', 'Gra edukacyjna o historii wydziału Matematyki i Informatyki.', '10000000-0000-4000-8000-000000000018', 1);

INSERT INTO group_members (group_id, user_id, role) VALUES
  ('11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000001', 'LEADER'),
  ('11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000002', 'MEMBER'),
  ('11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000003', 'MEMBER'),
  ('11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000004', 'MEMBER'),
  ('11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000005', 'MEMBER'),
  ('22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000006', 'LEADER'),
  ('22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000007', 'MEMBER'),
  ('22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000008', 'MEMBER'),
  ('33333333-3333-4333-8333-333333333333', '10000000-0000-4000-8000-000000000010', 'LEADER'),
  ('33333333-3333-4333-8333-333333333333', '10000000-0000-4000-8000-000000000011', 'MEMBER'),
  ('33333333-3333-4333-8333-333333333333', '10000000-0000-4000-8000-000000000012', 'MEMBER'),
  ('33333333-3333-4333-8333-333333333333', '10000000-0000-4000-8000-000000000013', 'MEMBER'),
  ('33333333-3333-4333-8333-333333333333', '10000000-0000-4000-8000-000000000014', 'MEMBER'),
  ('33333333-3333-4333-8333-333333333333', '10000000-0000-4000-8000-000000000015', 'MEMBER'),
  ('44444444-4444-4444-8444-444444444444', '10000000-0000-4000-8000-000000000018', 'LEADER');

INSERT INTO join_requests (group_id, user_id, status) VALUES
  ('11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000016', 'PENDING'),
  ('11111111-1111-4111-8111-111111111111', '10000000-0000-4000-8000-000000000017', 'PENDING'),
  ('22222222-2222-4222-8222-222222222222', '10000000-0000-4000-8000-000000000009', 'PENDING');

COMMIT;
SQL

echo "Seed complete for database $DB_DATABASE."
