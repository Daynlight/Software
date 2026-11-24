# Backend grup projektowych — design

Data: 2026-11-23
Branch: `feature/groups-backend` (na bazie `origin/groups` + merge `main`)

## Cel

Umożliwić aktywnym studentom tworzenie grup projektowych, wyszukiwanie istniejących grup oraz wysyłanie próśb o dołączenie. Lider grupy zarządza oczekującymi prośbami. Wszystkie operacje na członkostwie i limitach muszą być bezpieczne przy równoczesnych żądaniach.

## Zakres

W zakresie:

- utworzenie grupy i automatyczne przypisanie lidera,
- lista grup z wyszukiwaniem, filtrowaniem i stronicowaniem,
- wysłanie prośby o dołączenie,
- lista próśb dla lidera,
- akceptacja i odrzucenie prośby,
- limity: rekomendowane 5 osób, twardy limit 6 osób (łącznie z liderem),
- ostrzeżenia o dużej liczbie członków,
- migracje, Swagger, testy jednostkowe i integracyjne.

Poza zakresem:

- frontend,
- opuszczanie grupy, transfer lidera, zakończenie grupy,
- przypisywanie promotorów, semestry, administracja,
- edycja profilu i zdjęcia.

## Decyzje

- Baza: PostgreSQL + TypeORM, `synchronize: false`, migracje.
- Limit: `RECOMMENDED_MEMBERS = 5`, `MAX_MEMBERS = 6`, lider wliczany.
- Twardy limit 6: siódmy członek nie może zostać zaakceptowany (`409`).
- Prośbę można wysłać także do grupy pełnej; odpowiedź zawiera ostrzeżenie.
- Ostrzeżenia: przy 5 i 6 członkach oraz przy próbie dołączenia do grupy z 5/6 członkami.
- Tylko aktywni studenci (`USOS student_status = 2`) tworzą grupy i wysyłają prośby.
- Lider jest członkiem grupy z rolą `LEADER`; dokładnie jeden lider na grupę.
- Nazwa grupy nie musi być unikalna.
- Stare sesje bez wewnętrznego `users.id` wygasają; wymagane ponowne logowanie.

## Model danych

### users

- `id` uuid, PK
- `usos_id` varchar(32), unique, not null
- `first_name`, `last_name` varchar(100), not null
- `student_number` varchar(32), null
- `email` varchar(255), null
- `role` enum `STUDENT | OTHER`, not null
- `created_at`, `updated_at`

Przy logowaniu następuje upsert po `usos_id`: dane osobowe, numer albumu, e-mail i rola są odświeżane. `student_status = 2` daje `STUDENT`, pozostałe wartości `OTHER`.

### groups

- `id` uuid, PK
- `name` varchar(100), not null
- `description` text, not null
- `leader_id` uuid, FK -> users.id, not null
- `member_count` smallint, not null, default 1, check `1 <= member_count <= 6`
- `created_at`, `updated_at`

### group_members

- `id` uuid, PK
- `group_id` uuid, FK -> groups.id, on delete cascade
- `user_id` uuid, FK -> users.id, on delete cascade
- `role` enum `LEADER | MEMBER`, not null
- `joined_at` timestamptz, not null

Indeksy i ograniczenia:

- unique `(group_id, user_id)` — brak duplikatów członkostwa,
- unique `(user_id)` — użytkownik należy maksymalnie do jednej grupy,
- partial unique `(group_id) WHERE role = 'LEADER'` — dokładnie jeden lider,
- index `(user_id)`, `(group_id, role)`.

### join_requests

- `id` uuid, PK
- `group_id` uuid, FK -> groups.id, on delete cascade
- `user_id` uuid, FK -> users.id, on delete cascade
- `status` enum `PENDING | ACCEPTED | REJECTED | CANCELLED`, not null, default `PENDING`
- `created_at`, `updated_at`, `decided_at` (null), `decided_by` uuid (null, FK users.id)

Ograniczenia:

- partial unique `(user_id, group_id) WHERE status = 'PENDING'` — jedna aktywna prośba do danej grupy,
- index `(group_id, status)`, `(user_id, status)`.

## Limity i ostrzeżenia

Stałe domenowe:

- `RECOMMENDED_MEMBERS = 5`
- `MAX_MEMBERS = 6`

Kody ostrzeżeń:

- `GROUP_IS_LARGE` — grupa ma co najmniej 5 członków (łącznie z liderem),
- `GROUP_IS_FULL` — grupa ma 6 członków.

Zasady:

- utworzenie grupy: 1 członek (lider), bez ostrzeżenia,
- wysłanie prośby: dozwolone zawsze, jeśli użytkownik nie jest członkiem i nie ma oczekującej prośby do tej grupy; odpowiedź zawiera ostrzeżenia wynikające z aktualnej liczby członków,
- akceptacja: jeśli `member_count >= 6` → `409 Conflict`; w przeciwnym razie dodanie członka i ostrzeżenia dla nowej liczby członków,
- 6. członek jest akceptowany z `GROUP_IS_LARGE`; 7. jest odrzucany,
- odrzucenie nie zmienia liczby członków,
- lista grup zwraca `isFull` i `isLarge`.

## API

Wszystkie endpointy wymagają zalogowania. Prefix backendu: `/groups`; publicznie przez nginx: `/api/groups`.

### POST /groups

Request:

```json
{ "name": "Zespół A", "description": "Aplikacja do zarządzania PRI" }
```

Walidacja: `name` 3–100 znaków, `description` 10–2000 znaków.

Odpowiedzi:

- `201` — grupa + członkostwo lidera,
- `400` — walidacja,
- `401` — brak sesji,
- `403` — użytkownik nie jest studentem,
- `409` — użytkownik należy już do grupy.

Operacja w jednej transakcji: insert grupy i insert członkostwa `LEADER`.

### GET /groups

Query:

- `search` — szuka po nazwie, opisie i imieniu/nazwisku lidera (ILIKE),
- `leader` — filtruje po imieniu/nazwisku lidera,
- `hasFreeSlots` — boolean,
- `minFreeSlots` — 0–5,
- `page` — domyślnie 1,
- `limit` — domyślnie 20, maksymalnie 100,
- `sort` — `createdAt | name | memberCount | freeSlots`,
- `order` — `asc | desc`.

Odpowiedź:

```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Zespół A",
      "description": "Aplikacja do zarządzania PRI",
      "leader": { "id": "uuid", "firstName": "Jan", "lastName": "Kowalski" },
      "memberCount": 3,
      "maxMembers": 6,
      "recommendedMembers": 5,
      "freeSlots": 3,
      "isFull": false,
      "isLarge": false,
      "createdAt": "2026-11-23T10:00:00.000Z",
      "isMember": false,
      "myRequestStatus": null
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1
}
```

Filtrowanie i stronicowanie odbywa się w SQL, nie w pamięci. Pusta lista przy braku wyników.

### POST /groups/:groupId/join-requests

Odpowiedzi:

- `201` — `{ "request": {...}, "warnings": [{ "code": "...", "message": "..." }] }`,
- `400` — walidacja,
- `401` — brak sesji,
- `403` — użytkownik nie jest studentem,
- `404` — grupa nie istnieje,
- `409` — użytkownik jest już członkiem grupy lub ma oczekującą prośbę do tej grupy.

Prośba otrzymuje status `PENDING`. Wysłanie do pełnej grupy jest dozwolone i zwraca `GROUP_IS_FULL`; akceptacja i tak zwróci `409`.

### GET /groups/:groupId/join-requests

Tylko lider grupy.

Query: `status` (`PENDING` domyślnie, `ACCEPTED`, `REJECTED`, `CANCELLED`, `ALL`), `page`, `limit`.

Odpowiedź: lista próśb z danymi użytkownika (imię, nazwisko, numer albumu, e-mail), statusem i datami; paginacja.

Błędy: `403` dla nie-lidera, `404` dla nieistniejącej grupy.

### POST /groups/:groupId/join-requests/:requestId/accept

Tylko lider grupy.

Odpowiedzi:

- `200` — `{ "request": {...}, "warnings": [...] }`,
- `403` — nie-lider,
- `404` — grupa/prośba nie istnieje,
- `409` — prośba nie jest `PENDING`, grupa pełna, użytkownik jest już w innej grupie.

Transakcja:

1. `SELECT ... FOR UPDATE` grupy,
2. `SELECT ... FOR UPDATE` prośby,
3. ponowne sprawdzenie członkostwa użytkownika,
4. sprawdzenie `member_count < 6`,
5. insert `group_members` z rolą `MEMBER`,
6. inkrementacja `member_count`,
7. status prośby `ACCEPTED`, `decided_at`, `decided_by`,
8. anulowanie pozostałych `PENDING` próśb użytkownika (`CANCELLED`).

Unikalne indeksy są zabezpieczeniem przed race condition; błąd `23505` mapowany na `409`.

### POST /groups/:groupId/join-requests/:requestId/reject

Tylko lider grupy.

- `200` — prośba ze statusem `REJECTED`,
- `403` — nie-lider,
- `404` — brak grupy/prośby,
- `409` — prośba nie jest `PENDING`.

Brak dodania członka. `decided_at` i `decided_by` ustawione.

## Bezpieczeństwo i współbieżność

- Wszystkie operacje członkostwa w transakcji.
- Akceptacja blokuje wiersz grupy (`pessimistic_write`), więc równoczesne akceptacje są serializowane.
- Ponowne sprawdzenie członkostwa przy akceptacji.
- Unikalne indeksy: jedno członkostwo użytkownika, jeden lider, jedna pending prośba.
- `member_count` aktualizowany tylko w transakcji; check w bazie.
- Guard sesji ładuje użytkownika z DB i sprawdza rolę; brak użytkownika = `401`.
- Brak zaufania do `userId` z requestu; tożsamość wyłącznie z JWT.
- Walidacja DTO i whitelist pól.

## Uwierzytelnianie i użytkownicy

- USOS `student_status` dołączony do pobieranych pól.
- `role = STUDENT` tylko dla `student_status = 2`.
- `AuthService.complete` robi upsert użytkownika i wystawia JWT z `sub` = wewnętrzne `users.id`.
- `users.usos_id` pozostaje unikalnym powiązaniem z USOS.
- Stare tokeny bez wewnętrznego UUID nie przejdą guardu; użytkownik loguje się ponownie.

## Migracje i konfiguracja

- `DatabaseModule` z `TypeOrmModule.forRootAsync`, `synchronize: false`, `migrationsRun: true`.
- Migracja inicjalna tworzy tabele, enumy i indeksy.
- Konfiguracja DB przez `DB_*`; walidacja env.
- Testy integracyjne używają osobnej bazy/schematu i migracji.
- Lokalny wolumen Postgresa może wymagać resetu, jeśli zawiera tabele z `synchronize`.

## Swagger

- `@nestjs/swagger` w `main.ts`, UI pod `/docs` (publicznie `/api/docs`).
- DTO z `@ApiProperty`, opisane odpowiedzi i kody błędów.
- Schemat cookie `pri_session` w dokumentacji.

## Testy i coverage

- Testy jednostkowe: walidacja DTO, mapowanie błędów, logika bez DB.
- Testy integracyjne: prawdziwy Postgres, migracje, endpointy przez Supertest.
- Testy współbieżności: równoczesna akceptacja dwóch próśb przy 5 członkach; jedna kończy się sukcesem, druga `409`; `member_count = 6`.
- Testy ograniczeń: duplikat prośby, członek innej grupy, drugi lider, pełna grupa, 6. członek z ostrzeżeniem, 7. odrzucony.
- 100% coverage dla `src` poza `main.ts` i migracjami; progi w Jest.
- CI: usługa Postgres, migracje przed testami, `npm test -- --coverage`.
- Usunięcie mocka `@nestjs/typeorm` z testów; testy nie mogą opierać się na atrapie repozytoriów.

## Wykorzystanie brancha `groups`

- Zachowujemy encje `User`, `Group`, `GroupMember` i `UsersService` jako bazę.
- Usuwamy `synchronize`, mock TypeORM i nieużywane metody członkostwa spoza zakresu.
- Dodajemy `JoinRequest`, limity, search, kontrolery, DTO, Swagger, migracje i testy DB.
- `GroupPermission`/transfer/leave są poza zakresem; kod nieużywany nie zostaje.

## Ryzyka

- Brak `student_status` w USOS dla niektórych kont → `403`; użytkownik musi mieć aktywne studia.
- Zmiana `sub` na UUID unieważnia stare sesje.
- Migracja na istniejącej bazie dev z tabelami z `synchronize` wymaga czystego wolumenu.
- Wymaganie 100% coverage przy realnej bazie oznacza, że testy integracyjne muszą być częścią CI, nie opcjonalne.
