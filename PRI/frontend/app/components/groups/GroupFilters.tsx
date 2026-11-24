"use client";

import { GroupSort } from "../../lib/groups-client";

export interface GroupFilterValues {
  search: string;
  leader: string;
  hasFreeSlots: boolean;
  minFreeSlots: string;
  sort: GroupSort;
}

const field =
  "min-h-11 w-full rounded-[2px] border border-field bg-white px-3 py-2 text-sm leading-5 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const label = "mb-1 block text-xs font-semibold leading-4 text-muted";

export default function GroupFilters({
  values,
  onChange,
  onSubmit,
  onReset,
}: {
  values: GroupFilterValues;
  onChange: (values: GroupFilterValues) => void;
  onSubmit: () => void;
  onReset: () => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="border-y border-foreground py-5"
      aria-label="Filtry grup"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_160px_150px_auto] lg:items-end">
        <div>
          <label htmlFor="group-search" className={label}>
            Szukaj
          </label>
          <input
            id="group-search"
            name="search"
            type="search"
            autoComplete="off"
            value={values.search}
            onChange={(event) =>
              onChange({ ...values, search: event.target.value })
            }
            placeholder="Nazwa, opis lub lider…"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="group-leader" className={label}>
            Lider
          </label>
          <input
            id="group-leader"
            name="leader"
            type="search"
            autoComplete="off"
            value={values.leader}
            onChange={(event) =>
              onChange({ ...values, leader: event.target.value })
            }
            placeholder="Imię lub nazwisko…"
            className={field}
          />
        </div>

        <div>
          <label htmlFor="group-slots" className={label}>
            Minimum miejsc
          </label>
          <select
            id="group-slots"
            name="minFreeSlots"
            value={values.minFreeSlots}
            onChange={(event) =>
              onChange({ ...values, minFreeSlots: event.target.value })
            }
            className={field}
          >
            <option value="">Bez znaczenia</option>
            {[0, 1, 2, 3, 4, 5].map((slots) => (
              <option key={slots} value={String(slots)}>
                {slots}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="group-sort" className={label}>
            Sortowanie
          </label>
          <select
            id="group-sort"
            name="sort"
            value={values.sort}
            onChange={(event) =>
              onChange({ ...values, sort: event.target.value as GroupSort })
            }
            className={field}
          >
            <option value="createdAt">Najnowsze</option>
            <option value="name">Nazwa A–Z</option>
            <option value="freeSlots">Najwięcej miejsc</option>
            <option value="memberCount">Najmniejsze grupy</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 lg:pb-0">
          <label className="flex min-h-11 items-center gap-2 text-sm leading-5">
            <input
              type="checkbox"
              name="hasFreeSlots"
              checked={values.hasFreeSlots}
              onChange={(event) =>
                onChange({ ...values, hasFreeSlots: event.target.checked })
              }
              className="size-4 accent-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            />
            Tylko z wolnymi miejscami
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="min-h-10 rounded-[2px] bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Filtruj
            </button>
            <button
              type="button"
              onClick={onReset}
              className="min-h-10 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Wyczyść
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
