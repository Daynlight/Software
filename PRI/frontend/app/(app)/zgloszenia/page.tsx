"use client";

import Link from "next/link";
import JoinRequestInbox from "../../components/groups/JoinRequestInbox";
import { useMyGroup } from "../../lib/use-my-group";
import { useSessionUser } from "../../lib/use-session-user";

export default function JoinRequestsPage() {
  const user = useSessionUser();
  const { status, group, error, refresh } = useMyGroup(user?.id ?? null);

  if (!user) {
    return <p className="text-muted">Sprawdzanie sesji…</p>;
  }

  if (status === "loading" || status === "idle") {
    return <p role="status" className="text-muted">Pobieranie zgłoszeń…</p>;
  }

  if (status === "error") {
    return (
      <div role="alert" className="max-w-[60ch] border-l-2 border-danger py-2 pl-4">
        <p className="text-sm text-danger">
          {error ?? "Nie udało się pobrać zgłoszeń."}
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
      <div className="max-w-[60ch]">
        <p className="font-serif text-xl italic leading-6 text-muted">Zgłoszenia</p>
        <h1 className="mt-3 font-serif text-[42px] leading-tight">
          Najpierw dołącz do grupy.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Zgłoszenia o dołączenie widzi lider grupy. Znajdź zespół na giełdzie
          albo załóż własny.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link href="/gielda" className="text-sm font-semibold text-primary underline underline-offset-4">
            Przejdź do giełdy
          </Link>
          <Link href="/gielda/nowa" className="text-sm font-semibold text-primary underline underline-offset-4">
            Utwórz grupę
          </Link>
        </div>
      </div>
    );
  }

  const isLeader = group.leader.id === user.id;

  if (!isLeader) {
    return (
      <div className="max-w-[65ch]">
        <p className="font-serif text-xl italic leading-6 text-muted">Zgłoszenia</p>
        <h1 className="mt-3 font-serif text-[42px] leading-tight">
          Zgłoszenia widzi lider.
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Należysz do grupy „{group.name}”. Prośby o dołączenie rozpatruje lider.
          Jeśli chcesz kogoś zaprosić, porozmawiaj z nim.
        </p>
        <Link
          href="/moja-grupa"
          className="mt-6 inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          Wróć do mojej grupy
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div>
        <header className="border-b border-foreground pb-6">
          <p className="font-serif text-xl italic leading-6 text-muted">
            Zgłoszenia
          </p>
          <h1 className="mt-3 font-serif text-[42px] leading-[1.03]">
            Kto chce dołączyć do „{group.name}”?
          </h1>
          <p className="mt-3 max-w-[60ch] text-base leading-6 text-muted">
            Sprawdź profil i numer albumu, a potem zaakceptuj lub odrzuć prośbę.
            Po akceptacji osoba od razu zostaje członkiem grupy.
          </p>
        </header>

        <div className="mt-6">
          <JoinRequestInbox groupId={group.id} onChanged={() => void refresh()} />
        </div>
      </div>

      <aside className="border-t border-foreground pt-4">
        <h2 className="font-serif text-xl">Skład grupy</h2>
        <p className="mt-3 text-4xl">
          <span className="font-logo text-primary">{group.memberCount}</span>
          <span className="text-base text-muted"> z {group.maxMembers} osób</span>
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          {group.isFull
            ? "Grupa jest pełna. Nowe prośby nie mogą zostać zaakceptowane."
            : `Wolne miejsca: ${group.freeSlots}. Pamiętaj, że powyżej pięciu osób projekt może być trudniejszy w koordynacji.`}
        </p>
        <Link
          href="/moja-grupa"
          className="mt-5 inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          Wróć do mojej grupy
        </Link>
      </aside>
    </div>
  );
}
