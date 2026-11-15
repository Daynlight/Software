"use client";

import Link from "next/link";
import { useState } from "react";

type User = {
  firstName: string;
  lastName: string;
  indexNumber: string;
  role: string;
  about: string;
  skills: string;
};

const fieldClass =
  "w-full min-h-20 rounded-lg border border-field bg-white px-4 py-3 font-inter text-base leading-[1.4] text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export default function ProfileForm({ user }: { user: User }) {
  const [about, setAbout] = useState(user.about);
  const [skills, setSkills] = useState(user.skills);
  const [saved, setSaved] = useState(false);

  const readOnly = [
    { label: "Imię", value: user.firstName },
    { label: "Nazwisko", value: user.lastName },
    { label: "Numer indeksu", value: user.indexNumber },
    { label: "Rola w systemie", value: user.role },
  ];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: send this edit to backend
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-8 lg:grid-cols-[320px_128px_minmax(0,435px)] lg:gap-x-[60px]">
        <dl className="flex flex-col gap-2">
          {readOnly.map((f) => (
            <div key={f.label}>
              <dt className="text-sm leading-6 text-muted">{f.label}</dt>
              <dd className="font-medium leading-6">{f.value}</dd>
            </div>
          ))}
        </dl>

        <div className="order-first flex h-40 w-32 items-center justify-center bg-placeholder text-[15px] lg:order-none">
          Zdjęcie
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="about" className="mb-1 block text-sm leading-6 text-muted">
              O mnie
            </label>
            <textarea
              id="about"
              name="about"
              rows={3}
              value={about}
              onChange={(e) => {
                setAbout(e.target.value);
                setSaved(false);
              }}
              className={fieldClass}
            />
          </div>

          <div>
            <label htmlFor="skills" className="mb-1 block text-sm leading-6 text-muted">
              Umiejętności
            </label>
            <textarea
              id="skills"
              name="skills"
              rows={3}
              value={skills}
              aria-describedby="skills-hint"
              onChange={(e) => {
                setSkills(e.target.value);
                setSaved(false);
              }}
              className={fieldClass}
            />
            <p id="skills-hint" className="mt-1 text-sm text-muted">
              Wpisz umiejętności i technologie po przecinku.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4">
        {saved && (
          <p role="status" className="mr-auto text-sm">
            Dane nie zostały jeszcze wysłane na serwer (backend w przygotowaniu).
          </p>
        )}
        <Link href="/dashboard" className="text-[15px] underline">
          Anuluj
        </Link>
        <button
          type="submit"
          className="rounded-[2px] bg-primary px-6 py-[13px] text-[15px] font-semibold leading-5 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Zapisz profil
        </button>
      </div>
    </form>
  );
}