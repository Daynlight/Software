# Groups Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodać backend grup projektowych: tworzenie, wyszukiwanie oraz prośby o dołączenie z akceptacją/odrzuceniem przez lidera, bezpieczne współbieżnie.

**Architecture:** PostgreSQL + TypeORM z migracjami. Encje `users`, `groups`, `group_members`, `join_requests`. Operacje członkostwa w transakcjach z blokadą wiersza grupy. Kontrolery NestJS + DTO + Swagger. Testy jednostkowe i integracyjne na prawdziwym Postgresie.

**Tech Stack:** NestJS 10, TypeORM, PostgreSQL, Jest, Supertest, `@nestjs/swagger`.

**Spec:** `docs/superpowers/specs/2026-11-23-groups-backend-design.md`

## Global Constraints

- Limit: rekomendowane 5, twarde 6 (lider wliczany).
- Ostrzeżenia: `GROUP_IS_LARGE` (>=5), `GROUP_IS_FULL` (>=6).
- Tylko rola `STUDENT` (USOS `student_status = 2`).
- 100% coverage `src` poza `main.ts` i migracjami.
- Brak komentarzy w kodzie.
- Bez pushowania; commity lokalne.

### Task 1: Fundament bazy i migracja

**Files:** `src/database/**`, `src/config/configuration.ts`, `src/config/environment.ts`, `test/global-setup.ts`, `PRI/backend/.env.template`

- [ ] Dodać konfigurację DB i walidację env.
- [ ] Zdefiniować encje i enumy.
- [ ] Napisać migrację początkową z indeksami i checkami.
- [ ] Skonfigurować TypeORM `synchronize:false`, `migrationsRun:true`.
- [ ] Dodać global setup testów (baza `pri_test`, migracje, truncate).
- [ ] Uruchomić build i testy.

### Task 2: Użytkownicy i rola z USOS

**Files:** `src/auth/**`, `src/database/users/**`

- [ ] Dodać `student_status` do pól USOS.
- [ ] Mapować `student_status=2` na `STUDENT`, inaczej `OTHER`.
- [ ] Upsert użytkownika aktualizujący dane przy logowaniu.
- [ ] JWT `sub` = wewnętrzne UUID; dodać rolę do sesji.
- [ ] Testy mapowania, upsertu i sesji.

### Task 3: Tworzenie grupy

**Files:** `src/database/groups/**`, `src/groups/**`

- [ ] DTO `CreateGroupDto` (name 3–100, description 10–2000).
- [ ] `POST /groups` z transakcją grupa + lider.
- [ ] Blokada drugiej grupy i nie-studenta.
- [ ] Testy sukcesu, walidacji, 403, 409, atomowości.

### Task 4: Wyszukiwanie grup

**Files:** `src/groups/**`

- [ ] DTO query z walidacją i paginacją.
- [ ] SQL: search po nazwie/opisie/liderze, `hasFreeSlots`, `minFreeSlots`, sort, page/limit.
- [ ] Odpowiedź z `memberCount`, `freeSlots`, `isFull`, `isLarge`, `isMember`, `myRequestStatus`.
- [ ] Testy filtrów, sortowania, paginacji, pustej listy i błędnych parametrów.

### Task 5: Wysyłanie prośby

**Files:** `src/database/join_requests/**`, `src/groups/**`

- [ ] Encja + statusy + unikalny pending.
- [ ] `POST /groups/:id/join-requests`.
- [ ] Blokady: członek grupy, duplikat pending; pełna grupa dozwolona z warningiem.
- [ ] Testy statusów, warningów, 403/404/409, wyścigu duplikatów.

### Task 6: Lista próśb lidera

- [ ] `GET /groups/:id/join-requests` z filtrem statusu i paginacją.
- [ ] Tylko lider; dane użytkownika w odpowiedzi.
- [ ] Testy uprawnień, pustej listy, paginacji.

### Task 7: Akceptacja i odrzucenie

- [ ] `POST .../accept` w transakcji z `pessimistic_write`.
- [ ] Ponowne sprawdzenie członkostwa, limitu i statusu.
- [ ] Rollback przy 409; anulowanie pozostałych pending.
- [ ] `POST .../reject` z aktualizacją statusu.
- [ ] Testy 6./7. członka, pełnej grupy, użytkownika w innej grupie, równoczesnych akceptacji.

### Task 8: Swagger i dokumentacja

- [ ] `@nestjs/swagger` + UI `/docs`.
- [ ] DTO, odpowiedzi, kody błędów, cookie auth.
- [ ] Weryfikacja OpenAPI.

### Task 9: CI, coverage i porządki

- [ ] Postgres service w GitHub Actions.
- [ ] Usunięcie mocka TypeORM i testów-opakowań.
- [ ] Coverage 100% i progi.
- [ ] Lint, build, pełny test run.
- [ ] Commit końcowy.

## Weryfikacja

- `npm test -- --coverage` — 100%.
- `npm run test:e2e` (lub integration) — zielone.
- `npm run lint`, `npm run build`.
- Testy współbieżności na prawdziwym Postgresie.
