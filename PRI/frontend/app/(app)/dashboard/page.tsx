"use client";

import Link from "next/link";
import Card from "../../components/Card";
import UserPhoto from "../../components/UserPhoto";
import { useSessionUser } from "../../lib/use-session-user";

export default function DashboardPage() {
  const user = useSessionUser();

  if (!user) {
    return <p className="text-muted">Sprawdzanie sesji…</p>;
  }

  const fields = [
    { label: "Imię", value: user.firstName },
    { label: "Nazwisko", value: user.lastName },
    { label: "Numer albumu", value: user.studentNumber ?? "—" },
    { label: "E-mail", value: user.email ?? "Brak danych" },
  ];

  return (
    <div>
      <h1 className="sr-only">
        Pulpit: {user.firstName} {user.lastName}
      </h1>

      <section
        aria-labelledby="groups-shortcut"
        className="mb-6 flex flex-wrap items-center justify-between gap-4 border-y border-foreground py-5"
      >
        <div>
          <h2 id="groups-shortcut" className="font-serif text-2xl leading-tight">
            Grupy projektowe
          </h2>
          <p className="mt-1 max-w-[58ch] text-sm leading-6 text-muted">
            Znajdź zespół na giełdzie albo zarządzaj prośbami o dołączenie do
            swojej grupy.
          </p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold">
          <Link
            href="/gielda"
            className="text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Giełda grup
          </Link>
          <Link
            href="/moja-grupa"
            className="text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Moja grupa
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <Card id="komunikaty" title="Komunikaty">
            <p className="py-6 text-center text-muted">brak nowych komunikatów</p>
          </Card>
          <Card id="powiadomienia" title="Powiadomienia">
            <p className="py-3 text-center text-primary">brak nowych komunikatów</p>
          </Card>
        </div>

        <Card id="moje-dane" title="Moje dane">
          <div className="flex flex-col-reverse gap-6 sm:flex-row sm:justify-between">
            <dl className="flex flex-col gap-2">
              {fields.map((field) => (
                <div key={field.label}>
                  <dt className="text-sm leading-6 text-muted">{field.label}</dt>
                  <dd className="font-medium leading-6">{field.value}</dd>
                </div>
              ))}
            </dl>

            <UserPhoto
              url={user.photoUrl}
              className="h-40 w-32 shrink-0 object-cover"
            />
          </div>

          <Link
            href="/dashboard/profile"
            className="self-end rounded-[2px] bg-primary px-6 py-[13px] text-[15px] font-semibold leading-5 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Edytuj profil
          </Link>
        </Card>
      </div>
    </div>
  );
}
