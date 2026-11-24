# Baza danych — skrypty deweloperskie

Skrypty działają na `docker-compose-dev.yaml` i bazie z `PRI/.env`.

## Reset bazy

```bash
./DB-scripts/dbReset.sh
```

Usuwa kontenery i wolumeny, a następnie uruchamia czysty `db_dev`. Operacja jest destrukcyjna.

## Seed

```bash
./DB-scripts/seed.sh
```

Uruchamia `db_dev` i `backend_dev` (migracje wykonują się przy starcie), czyści tabele i wstawia przykładowe dane:

- 18 użytkowników, w tym konto `Ruslan Trytsetskyi` (`usos_id=581385`) jako lider grupy PRI Team Alpha,
- 4 grupy: Alpha (5/6), AI Research Squad (3/6), Green Campus (6/6), Game Jam (1/6),
- 15 członkostw i 3 oczekujące prośby o dołączenie.

Po seedzie uruchom cały stack:

```bash
docker compose -f docker-compose-dev.yaml up -d
```

## Statystyki

```bash
./DB-scripts/stats.sh
```
