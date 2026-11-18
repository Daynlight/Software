"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UsosUser } from "../lib/session-client";

const MOCK_PROFILE = false;

type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; user: UsosUser };

async function fetchProfile(): Promise<UsosUser> {
  if (MOCK_PROFILE) {
    return {
      id: "123",
      firstName: "Jan",
      lastName: "Kowalski",
      email: "jan.kowalski@st.amu.edu.pl",
      studentNumber: "123456",
      role: "student",
    };
  }

  const response = await fetch("/api/auth/me");

  if (!response.ok) {
    throw new Error(response.status === 401 ? "unauthorized" : "profile_error");
  }

  return (await response.json()) as UsosUser;
}

export default function ProfileDetails() {
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    let active = true;

    void fetchProfile()
      .then((user) => {
        if (active) {
          setState({ status: "ready", user });
        }
      })
      .catch((error: Error) => {
        if (!active) {
          return;
        }

        if (error.message === "unauthorized") {
          router.replace("/login");
          return;
        }

        setState({ status: "error" });
      });

    return () => {
      active = false;
    };
  }, [router]);

  function handleRetry(): void {
    setState({ status: "loading" });

    void fetchProfile()
      .then((user) => {
        setState({ status: "ready", user });
      })
      .catch((error: Error) => {
        if (error.message === "unauthorized") {
          router.replace("/login");
          return;
        }

        setState({ status: "error" });
      });
  }

  if (state.status === "loading") {
    return (
      <div role="status" className="flex items-center gap-3 py-10">
        <span
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-4 border-border border-t-primary motion-reduce:animate-none"
        />
        <span>Ładowanie profilu…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-xl border border-border bg-surface p-6"
      >
        <h2 className="mb-2 text-xl font-semibold">
          Nie udało się załadować profilu
        </h2>

        <p className="mb-4 text-muted">
          Wystąpił problem z pobraniem danych.
        </p>

        <button
          type="button"
          onClick={handleRetry}
          className="rounded-[2px] bg-primary px-6 py-[13px] text-[15px] font-semibold leading-5 text-primary-foreground"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  const fields = [
    { label: "Imię", value: state.user.firstName },
    { label: "Nazwisko", value: state.user.lastName },
    {
      label: "Numer albumu",
      value: state.user.studentNumber ?? "Brak danych",
    },
    {
      label: "E-mail",
      value: state.user.email ?? "Brak danych",
    },
    { label: "Rola", value: state.user.role },
  ];

  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      {fields.map((field) => (
        <div key={field.label}>
          <dt className="text-sm leading-6 text-muted">{field.label}</dt>
          <dd className="break-words font-medium leading-6">
            {field.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}