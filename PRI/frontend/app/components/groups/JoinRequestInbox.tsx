"use client";

import { useCallback, useEffect, useState } from "react";
import {
  acceptJoinRequest,
  JoinRequest,
  listJoinRequests,
  rejectJoinRequest,
} from "../../lib/groups-client";

const button =
  "min-h-9 rounded-[2px] border border-primary px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50";
const dangerButton =
  "min-h-9 rounded-[2px] border border-danger px-3 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger disabled:cursor-not-allowed disabled:opacity-50";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export default function JoinRequestInbox({
  groupId,
  onChanged,
}: {
  groupId: string;
  onChanged?: () => void;
}) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    const response = await listJoinRequests(groupId, {
      status: "PENDING",
      limit: 100,
    });

    return response.items;
  }, [groupId]);

  useEffect(() => {
    let active = true;
    void fetchRequests()
      .then((items) => {
        if (active) {
          setRequests(items);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadError(
            cause instanceof Error
              ? cause.message
              : "Nie udało się pobrać zgłoszeń.",
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchRequests]);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      setRequests(await fetchRequests());
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się pobrać zgłoszeń.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  async function accept(request: JoinRequest): Promise<void> {
    setActionId(request.id);
    setActionError(null);
    setNotice(null);

    try {
      const result = await acceptJoinRequest(groupId, request.id);
      setRequests((current) =>
        current.filter((item) => item.id !== request.id),
      );
      setNotice(
        result.warnings.length > 0
          ? result.warnings.map((warning) => warning.message).join(" ")
          : `Dodano ${request.user.firstName} ${request.user.lastName} do grupy.`,
      );
      onChanged?.();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Nie udało się zaakceptować.",
      );
    } finally {
      setActionId(null);
    }
  }

  async function reject(request: JoinRequest): Promise<void> {
    setActionId(request.id);
    setActionError(null);
    setNotice(null);

    try {
      await rejectJoinRequest(groupId, request.id);
      setRequests((current) =>
        current.filter((item) => item.id !== request.id),
      );
      setConfirmId(null);
      setNotice(`Odrzucono prośbę ${request.user.firstName} ${request.user.lastName}.`);
      onChanged?.();
    } catch (cause) {
      setActionError(
        cause instanceof Error ? cause.message : "Nie udało się odrzucić.",
      );
    } finally {
      setActionId(null);
    }
  }

  if (loading) {
    return (
      <p role="status" className="py-6 text-sm text-muted">
        Pobieranie zgłoszeń…
      </p>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="border-l-2 border-danger py-2 pl-4">
        <p className="text-sm text-danger">{loadError}</p>
        <button type="button" onClick={() => void load()} className="mt-2 rounded-[2px] text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  return (
    <div>
      {actionError && (
        <p
          role="alert"
          className="mb-4 border-l-2 border-danger pl-4 text-sm leading-6 text-danger"
        >
          {actionError}
        </p>
      )}

      {notice && (
        <p
          role="status"
          className="mb-4 border-l-2 border-primary bg-surface px-4 py-3 text-sm leading-6"
        >
          {notice}
        </p>
      )}

      {requests.length === 0 ? (
        <p className="py-6 text-sm text-muted">
          Brak oczekujących próśb. Gdy ktoś poprosi o dołączenie, zobaczysz to
          tutaj.
        </p>
      ) : (
        <ul className="border-t border-foreground">
          {requests.map((request) => (
            <li
              key={request.id}
              className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-serif text-xl leading-tight">
                  {request.user.firstName} {request.user.lastName}
                </p>
                <p className="mt-1 text-sm leading-5 text-muted">
                  Numer albumu: {request.user.studentNumber ?? "brak danych"}
                </p>
                <p className="text-sm leading-5 text-muted">
                  {request.user.email ?? "Brak adresu e-mail"}
                </p>
                <p className="mt-1 text-xs leading-4 text-muted">
                  Zgłoszenie z {formatDate(request.createdAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                {confirmId === request.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => void reject(request)}
                      disabled={actionId === request.id}
                      className={dangerButton}
                    >
                      Potwierdź odrzucenie
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(null)}
                      className="min-h-9 rounded-[2px] px-3 py-2 text-xs font-medium underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      Anuluj
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => void accept(request)}
                      disabled={actionId === request.id}
                      className={button}
                    >
                      {actionId === request.id ? "Przetwarzanie…" : "Akceptuj"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmId(request.id)}
                      disabled={actionId === request.id}
                      className={dangerButton}
                    >
                      Odrzuć
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
