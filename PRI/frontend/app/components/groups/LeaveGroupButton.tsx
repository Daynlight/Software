"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GroupSummary, leaveGroup } from "../../lib/groups-client";

const button =
  "min-h-10 rounded-[2px] border border-danger px-4 py-2 text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-50";

export default function LeaveGroupButton({
  group,
  isLeader,
}: {
  group: GroupSummary;
  isLeader: boolean;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const willDelete = group.memberCount === 1;
  const warning = willDelete
    ? "Ta grupa jest pusta. Opuszczenie jej spowoduje trwałe usunięcie grupy."
    : isLeader
      ? "Po opuszczeniu liderem zostanie losowo wybrany członek grupy. Nie będziesz już widzieć jej danych."
      : "Po opuszczeniu nie będziesz już widzieć zgłoszeń ani danych grupy.";

  async function handleLeave(): Promise<void> {
    setLeaving(true);
    setError(null);

    try {
      await leaveGroup(group.id);
      router.push("/gielda");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się opuścić grupy. Spróbuj ponownie.",
      );
      setLeaving(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={button}
      >
        Opuść grupę
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3 border-l-2 border-danger pl-4">
      <p className="text-sm leading-6 text-danger">
        {warning}
      </p>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleLeave()}
          disabled={leaving}
          className={button}
        >
          {leaving ? "Opuszczanie…" : "Potwierdź opuszczenie"}
        </button>
        <button
          type="button"
          onClick={() => {
            setConfirming(false);
            setError(null);
          }}
          className="min-h-10 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}
