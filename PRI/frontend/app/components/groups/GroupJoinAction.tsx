"use client";

import Link from "next/link";
import { useState } from "react";
import {
  GroupSummary,
  GroupWarning,
  requestJoin,
} from "../../lib/groups-client";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-[2px] bg-primary px-5 py-3 text-sm font-semibold leading-5 text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60";

export default function GroupJoinAction({
  group,
  disabled = false,
  disabledReason,
}: {
  group: GroupSummary;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [warnings, setWarnings] = useState<GroupWarning[]>([]);
  const [error, setError] = useState<string | null>(null);

  if (group.isMember) {
    return (
      <div className="flex flex-col items-start gap-2 md:items-end">
        <span className="text-sm font-semibold text-success">
          Należysz do tej grupy
        </span>
        <Link
          href="/moja-grupa"
          className="text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Przejdź do grupy
        </Link>
      </div>
    );
  }

  if (group.myRequestStatus === "PENDING" || state === "sent") {
    return (
      <div className="flex flex-col items-start gap-2 md:items-end">
        <span
          role="status"
          className="border border-primary px-3 py-2 text-sm font-semibold text-primary"
        >
          Prośba oczekuje
        </span>
        <span className="text-right text-xs leading-5 text-muted">
          Lider zdecyduje o dołączeniu.
        </span>
        {warnings.map((warning) => (
          <p
            key={warning.code}
            role="status"
            className="max-w-[240px] text-left text-xs leading-5 text-muted md:text-right"
          >
            {warning.message}
          </p>
        ))}
      </div>
    );
  }

  if (disabled) {
    return (
      <p className="max-w-[220px] text-sm leading-5 text-muted md:text-right">
        {disabledReason ?? "Nie możesz teraz dołączyć do grupy."}
      </p>
    );
  }

  async function handleRequest(): Promise<void> {
    setState("sending");
    setError(null);

    try {
      const result = await requestJoin(group.id);
      setWarnings(result.warnings);
      setState("sent");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się wysłać prośby. Spróbuj ponownie.",
      );
      setState("idle");
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 md:items-end">
      {group.isFull && (
        <p className="max-w-[230px] text-sm leading-5 text-danger md:text-right">
          Grupa jest pełna. Prośbę możesz wysłać, ale dołączenie nie będzie możliwe
          bez zwolnienia miejsca.
        </p>
      )}
      {group.isLarge && !group.isFull && (
        <p className="max-w-[230px] text-sm leading-5 text-muted md:text-right">
          To duża grupa. Projekt może wymagać więcej koordynacji.
        </p>
      )}

      <button
        type="button"
        onClick={() => void handleRequest()}
        disabled={state === "sending"}
        className={primaryButton}
      >
        {state === "sending" ? "Wysyłanie…" : "Poproś o dołączenie"}
      </button>

      {error && (
        <p role="alert" className="max-w-[240px] text-sm leading-5 text-danger md:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
