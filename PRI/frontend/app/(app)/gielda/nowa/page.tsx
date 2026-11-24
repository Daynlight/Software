"use client";

import Link from "next/link";
import CreateGroupForm from "../../../components/groups/CreateGroupForm";
import { useSessionUser } from "../../../lib/use-session-user";

export default function NewGroupPage() {
  const user = useSessionUser();

  if (!user) {
    return <p className="text-muted">Sprawdzanie sesji…</p>;
  }

  if (user.role === "OTHER") {
    return (
      <div className="max-w-[65ch]">
        <h1 className="font-serif text-[42px] leading-tight">Utwórz grupę</h1>
        <p className="mt-4 border-l-2 border-danger pl-4 text-sm leading-6 text-danger">
          Grupy mogą zakładać tylko studenci. Ta sesja nie ma uprawnień do
          utworzenia grupy.
        </p>
        <Link
          href="/gielda"
          className="mt-6 inline-block text-sm font-semibold text-primary underline underline-offset-4"
        >
          Wróć do giełdy
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,320px)_minmax(0,640px)] lg:gap-20">
      <header>
        <p className="font-serif text-xl italic leading-6 text-muted">
          Nowa grupa
        </p>
        <h1 className="mt-3 font-serif text-[42px] leading-[1.03] tracking-[-0.01em]">
          Zacznij od pomysłu. Reszta przyjdzie z zespołem.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          Po utworzeniu grupy zostajesz jej liderem. Możesz przyjmować prośby o
          dołączenie i razem pracować nad projektem.
        </p>
        <dl className="mt-8 border-t border-foreground">
          <div className="flex gap-3 border-b border-border py-3 text-sm">
            <dt className="w-24 shrink-0 text-muted">Nazwa</dt>
            <dd>3–100 znaków, widoczna na giełdzie</dd>
          </div>
          <div className="flex gap-3 border-b border-border py-3 text-sm">
            <dt className="w-24 shrink-0 text-muted">Opis</dt>
            <dd>10–2000 znaków o celu i zakresie projektu</dd>
          </div>
          <div className="flex gap-3 border-b border-border py-3 text-sm">
            <dt className="w-24 shrink-0 text-muted">Limit</dt>
            <dd>rekomendowane 5 osób, maksymalnie 6 z liderem</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="create-group-title" className="border-t border-foreground pt-6">
        <h2 id="create-group-title" className="mb-6 font-serif text-2xl">
          Dane grupy
        </h2>
        <CreateGroupForm />
      </section>
    </div>
  );
}
