"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import GroupBoardRow from "../../components/groups/GroupBoardRow";
import GroupFilters, {
  GroupFilterValues,
} from "../../components/groups/GroupFilters";
import {
  GroupSearchResponse,
  GroupSort,
  searchGroups,
} from "../../lib/groups-client";
import { useSessionUser } from "../../lib/use-session-user";

const initialFilters: GroupFilterValues = {
  search: "",
  leader: "",
  hasFreeSlots: false,
  minFreeSlots: "",
  sort: "createdAt",
};

const orderFor: Record<GroupSort, "asc" | "desc"> = {
  createdAt: "desc",
  name: "asc",
  freeSlots: "desc",
  memberCount: "asc",
};

export default function GroupMarketPage() {
  const user = useSessionUser();
  const [draft, setDraft] = useState<GroupFilterValues>(initialFilters);
  const [applied, setApplied] = useState<GroupFilterValues>(initialFilters);
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<GroupSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;

    void searchGroups({
      search: applied.search.trim() || undefined,
      leader: applied.leader.trim() || undefined,
      hasFreeSlots: applied.hasFreeSlots ? true : undefined,
      minFreeSlots:
        applied.minFreeSlots === "" ? undefined : Number(applied.minFreeSlots),
      page,
      limit: 10,
      sort: applied.sort,
      order: orderFor[applied.sort],
    })
      .then((response) => {
        if (active) {
          setResult(response);
          setLoading(false);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Nie udało się pobrać grup.",
          );
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [applied, page, reloadKey, userId]);

  if (!user) {
    return <p className="text-muted">Sprawdzanie sesji…</p>;
  }

  const canJoin = user.role !== "OTHER";

  return (
    <div>
      <header className="grid gap-6 border-b border-foreground pb-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <p className="font-serif text-xl italic leading-6 text-muted">
            Grupy projektowe · semestr 2026/27
          </p>
          <h1 className="mt-3 max-w-[18ch] font-serif text-[42px] leading-[1.02] tracking-[-0.01em] sm:text-[52px]">
            Znajdź zespół, z którym chcesz pracować.
          </h1>
          <p className="mt-5 max-w-[60ch] text-base leading-7 text-muted">
            Przeglądaj grupy według tematu, lidera i liczby wolnych miejsc.
            Wyślij prośbę, a lider zdecyduje o dołączeniu.
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          {canJoin && (
            <Link
              href="/gielda/nowa"
              className="inline-flex min-h-11 items-center rounded-[2px] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Utwórz grupę
            </Link>
          )}
          <p className="max-w-[260px] text-sm leading-5 text-muted lg:text-right">
            Grupę zakłada student, który zostaje jej liderem.
          </p>
        </div>
      </header>

      {!canJoin && (
        <p className="mt-6 border-l-2 border-danger pl-4 text-sm leading-6 text-danger">
          Ta sesja nie ma uprawnień studenta. Możesz przeglądać grupy, ale nie
          możesz tworzyć grup ani wysyłać próśb.
        </p>
      )}

      <div className="mt-8">
        <GroupFilters
          values={draft}
          onChange={setDraft}
          onSubmit={() => {
            setLoading(true);
            setError(null);
            setApplied(draft);
            setPage(1);
          }}
          onReset={() => {
            setLoading(true);
            setError(null);
            setDraft(initialFilters);
            setApplied(initialFilters);
            setPage(1);
          }}
        />
      </div>

      <section aria-labelledby="group-list-title" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="group-list-title" className="font-serif text-[28px] leading-tight">
            Grupy na giełdzie
          </h2>
          {result && (
            <p className="text-sm text-muted" aria-live="polite">
              {result.total === 0
                ? "Brak wyników"
                : `Liczba grup: ${result.total}`}
            </p>
          )}
        </div>

        {loading && (
          <p role="status" className="py-10 text-muted">
            Pobieranie grup…
          </p>
        )}

        {!loading && error && (
          <div role="alert" className="mt-4 border-l-2 border-danger py-2 pl-4">
            <p className="text-sm text-danger">{error}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                setError(null);
                setReloadKey((value) => value + 1);
              }}
              className="mt-2 text-sm underline"
            >
              Spróbuj ponownie
            </button>
          </div>
        )}

        {!loading && !error && result && result.items.length === 0 && (
          <div className="mt-6 border-y border-border py-10">
            <p className="font-serif text-2xl">Nie ma jeszcze takiej grupy.</p>
            <p className="mt-2 max-w-[55ch] text-sm leading-6 text-muted">
              Zmień filtry albo załóż własną grupę i zaproś osoby, z którymi
              chcesz pracować.
            </p>
            <Link
              href="/gielda/nowa"
              className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4"
            >
              Utwórz pierwszą grupę
            </Link>
          </div>
        )}

        {!loading && !error && result && result.items.length > 0 && (
          <>
            <ol className="mt-3">
              {result.items.map((group) => (
                <GroupBoardRow
                  key={group.id}
                  group={group}
                  canJoin={canJoin}
                  joinDisabledReason="Tylko studenci mogą wysyłać prośby o dołączenie."
                />
              ))}
            </ol>

            {result.totalPages > 1 && (
              <nav
                aria-label="Strony giełdy grup"
                className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm"
              >
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    setPage((value) => Math.max(1, value - 1));
                  }}
                  disabled={page <= 1}
                  className="min-h-10 border border-border px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Poprzednia
                </button>
                <span className="text-muted">
                  Strona {result.page} z {result.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError(null);
                    setPage((value) => Math.min(result.totalPages, value + 1));
                  }}
                  disabled={page >= result.totalPages}
                  className="min-h-10 border border-border px-4 py-2 font-medium disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Następna
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </div>
  );
}
