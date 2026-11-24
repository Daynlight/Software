"use client";

import Link from "next/link";
import { useState } from "react";
import GroupEditForm from "../../components/groups/GroupEditForm";
import GroupMembers from "../../components/groups/GroupMembers";
import JoinRequestInbox from "../../components/groups/JoinRequestInbox";
import LeaveGroupButton from "../../components/groups/LeaveGroupButton";
import { useMyGroup } from "../../lib/use-my-group";
import { useSessionUser } from "../../lib/use-session-user";

export default function MyGroupPage() {
  const user = useSessionUser();
  const { status, group, error, refresh } = useMyGroup(user?.id ?? null);
  const [editing, setEditing] = useState(false);

  if (!user) {
    return <p className="text-muted">Sprawdzanie sesji…</p>;
  }

  if (status === "loading" || status === "idle") {
    return <p role="status" className="text-muted">Pobieranie Twojej grupy…</p>;
  }

  if (status === "error") {
    return (
      <div role="alert" className="max-w-[60ch] border-l-2 border-danger py-2 pl-4">
        <p className="text-sm text-danger">
          {error ?? "Nie udało się pobrać Twojej grupy."}
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-2 text-sm underline"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
        <div>
          <p className="font-serif text-xl italic leading-6 text-muted">
            Moja grupa
          </p>
          <h1 className="mt-3 max-w-[17ch] font-serif text-[42px] leading-[1.03] sm:text-[52px]">
            Nie masz jeszcze grupy.
          </h1>
          <p className="mt-5 max-w-[58ch] text-base leading-7 text-muted">
            Dołącz do istniejącej grupy na giełdzie albo załóż własną. Jako lider
            zaprosisz osoby, z którymi chcesz pracować.
          </p>
          <div className="mt-7 flex flex-wrap gap-4">
            <Link
              href="/gielda"
              className="inline-flex min-h-11 items-center rounded-[2px] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Przejdź do giełdy
            </Link>
            <Link
              href="/gielda/nowa"
              className="inline-flex min-h-11 items-center border border-primary px-6 py-3 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Utwórz grupę
            </Link>
          </div>
        </div>

        <aside className="border-t border-foreground pt-4">
          <p className="font-serif text-xl">Jak to działa</p>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm leading-6 text-muted">
            <li>Wybierz grupę, której temat Ci odpowiada.</li>
            <li>Wyślij prośbę o dołączenie i poczekaj na decyzję lidera.</li>
            <li>Po akceptacji zobaczysz tutaj skład i zgłoszenia.</li>
          </ol>
        </aside>
      </div>
    );
  }

  const isLeader = group.leader.id === user.id;

  return (
    <div>
      <header className="border-b border-foreground pb-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-serif text-xl italic leading-6 text-muted">
              Moja grupa
            </p>
            <h1 className="mt-3 max-w-[20ch] font-serif text-[44px] leading-[1.02] tracking-[-0.01em]">
              {group.name}
            </h1>
          </div>
          <div className="flex items-end gap-3">
            <span
              aria-hidden="true"
              className="font-logo text-[54px] leading-none text-primary"
            >
              {group.freeSlots}
            </span>
            <span className="pb-1 text-xs leading-5 text-muted">
              {group.isFull ? "komplet" : "wolne miejsca"}
            </span>
          </div>
        </div>

        <p className="mt-5 max-w-[70ch] text-base leading-7 text-muted">
          {group.description}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {isLeader && !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="min-h-10 rounded-[2px] border border-primary px-4 py-2 text-sm font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              Edytuj dane
            </button>
          )}
          <LeaveGroupButton group={group} isLeader={isLeader} />
        </div>

        {editing && (
          <GroupEditForm
            group={group}
            onCancel={() => setEditing(false)}
            onUpdated={() => {
              setEditing(false);
              void refresh();
            }}
          />
        )}

        <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-2 text-sm leading-5">
          <div className="flex gap-2">
            <dt className="text-muted">Lider</dt>
            <dd className="font-medium">
              {group.leader.firstName} {group.leader.lastName}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Skład</dt>
            <dd className="font-medium">
              {group.memberCount} z {group.maxMembers} osób
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Rola</dt>
            <dd className="font-medium">{isLeader ? "lider" : "członek"}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="members-title" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="members-title" className="font-serif text-2xl">
            Członkowie
          </h2>
          <p className="text-sm text-muted">
            {group.memberCount} z {group.maxMembers} osób
          </p>
        </div>
        <div className="mt-3">
          <GroupMembers groupId={group.id} />
        </div>
      </section>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="requests-title">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="requests-title" className="font-serif text-2xl">
              {isLeader ? "Oczekujące prośby" : "Zgłoszenia"}
            </h2>
            {isLeader && (
              <Link
                href="/zgloszenia"
                className="text-sm font-medium text-primary underline underline-offset-4"
              >
                Otwórz pełną listę
              </Link>
            )}
          </div>

          {isLeader ? (
            <div className="mt-3">
              <JoinRequestInbox groupId={group.id} onChanged={() => void refresh()} />
            </div>
          ) : (
            <p className="mt-4 max-w-[58ch] text-sm leading-6 text-muted">
              Zgłoszenia widzi lider grupy. Jeśli chcesz zaprosić kogoś do
              zespołu, poproś lidera o dodanie osoby.
            </p>
          )}
        </section>

        <aside className="border-t border-foreground pt-4">
          <h2 className="font-serif text-xl">Co dalej</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            Skład grupy możesz uzupełniać prośbami z giełdy. Pamiętaj, że po
            szóstym członku grupa jest pełna.
          </p>
          {!isLeader && (
            <Link
              href="/gielda"
              className="mt-4 inline-block text-sm font-semibold text-primary underline underline-offset-4"
            >
              Zobacz inne grupy
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
