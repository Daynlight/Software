"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Card from "../../components/Card";
import type { UsosUser } from "../../lib/session-client";

type DashboardState =
  | { status: "loading" }
  | { status: "error"; retrying: boolean }
  | { status: "ready"; user: UsosUser };

type DashboardResult =
  | { type: "ready"; user: UsosUser }
  | { type: "unauthorized" }
  | { type: "error" };

async function fetchDashboardData(): Promise<DashboardResult> {
  try {
    const response = await fetch("/api/auth/me");

    if (response.status === 401) {
      return { type: "unauthorized" };
    }

    if (!response.ok) {
      return { type: "error" };
    }

    const user = (await response.json()) as UsosUser;

    return {
      type: "ready",
      user,
    };
  } catch {
    return { type: "error" };
  }
}

export default function DashboardPage() {
  const router = useRouter();

  const [state, setState] = useState<DashboardState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;

    void fetchDashboardData().then((result) => {
      if (!active) {
        return;
      }

      if (result.type === "unauthorized") {
        router.replace("/login?error=session_expired");
        return;
      }

      if (result.type === "error") {
        setState({
          status: "error",
          retrying: false,
        });
        return;
      }

      setState({
        status: "ready",
        user: result.user,
      });
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleRetry(): Promise<void> {
    setState({
      status: "error",
      retrying: true,
    });

    const result = await fetchDashboardData();

    if (result.type === "unauthorized") {
      router.replace("/login?error=session_expired");
      return;
    }

    if (result.type === "error") {
      setState({
        status: "error",
        retrying: false,
      });
      return;
    }

    setState({
      status: "ready",
      user: result.user,
    });
  }

  if (state.status === "loading") {
    return (
      <div role="status" className="flex items-center gap-3 py-10">
        <span
          aria-hidden="true"
          className="size-6 animate-spin rounded-full border-4 border-border border-t-primary motion-reduce:animate-none"
        />
        <span>Ładowanie dashboardu…</span>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div
        role="alert"
        className="rounded-xl border border-border bg-surface p-6"
      >
        <h1 className="mb-2 text-xl font-semibold">
          Nie udało się załadować danych
        </h1>

        <p className="mb-4 text-muted">
          Nie udało się załadować danych. Spróbuj ponownie.
        </p>

        {state.retrying && (
          <p role="status" className="sr-only">
            Ponawianie pobierania danych…
          </p>
        )}

        <button
          type="button"
          disabled={state.retrying}
          onClick={() => void handleRetry()}
          className="inline-flex items-center gap-2 rounded-[2px] bg-primary px-6 py-[13px] text-[15px] font-semibold leading-5 text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {state.retrying && (
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
            />
          )}

          Spróbuj ponownie
        </button>
      </div>
    );
  }

  const { user } = state;

  const fields = [
    { label: "Imię", value: user.firstName },
    { label: "Nazwisko", value: user.lastName },
    { label: "Numer USOS", value: user.id },
  ];

  return (
    <div>
      <h1 className="sr-only">
        Pulpit: {user.firstName} {user.lastName}
      </h1>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          <Card id="komunikaty" title="Komunikaty">
            <p className="py-6 text-center text-muted">
              brak nowych komunikatów
            </p>
          </Card>

          <Card id="powiadomienia" title="Powiadomienia">
            <p className="py-3 text-center text-primary">
              brak nowych komunikatów
            </p>
          </Card>
        </div>

        <Card id="moje-dane" title="Moje dane">
          <div className="flex flex-col-reverse gap-6 sm:flex-row sm:justify-between">
            <dl className="flex flex-col gap-2">
              {fields.map((field) => (
                <div key={field.label}>
                  <dt className="text-sm leading-6 text-muted">
                    {field.label}
                  </dt>

                  <dd className="font-medium leading-6">
                    {field.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="flex h-40 w-32 shrink-0 items-center justify-center bg-placeholder text-[15px]">
              Zdjęcie
            </div>
          </div>

          <Link
            href="/dashboard/profile"
            className="self-end rounded-[2px] bg-primary px-6 py-[13px] text-[15px] font-semibold leading-5 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Zobacz profil
          </Link>
        </Card>
      </div>
    </div>
  );
}