"use client";

import { useCallback, useEffect, useState } from "react";
import { getGroupMembers, GroupMember } from "../../lib/groups-client";

export default function GroupMembers({ groupId }: { groupId: string }) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    return getGroupMembers(groupId);
  }, [groupId]);

  useEffect(() => {
    let active = true;

    void fetchMembers()
      .then((items) => {
        if (active) {
          setMembers(items);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Nie udało się pobrać składu grupy.",
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
  }, [fetchMembers]);

  const retry = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      setMembers(await fetchMembers());
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się pobrać składu grupy.",
      );
    } finally {
      setLoading(false);
    }
  }, [fetchMembers]);

  if (loading) {
    return (
      <p role="status" className="py-4 text-sm text-muted">
        Pobieranie składu…
      </p>
    );
  }

  if (error) {
    return (
      <div role="alert" className="border-l-2 border-danger py-2 pl-4">
        <p className="text-sm text-danger">{error}</p>
        <button
          type="button"
          onClick={() => void retry()}
          className="mt-2 rounded-[2px] text-sm underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Spróbuj ponownie
        </button>
      </div>
    );
  }

  if (members.length === 0) {
    return <p className="py-4 text-sm text-muted">Grupa nie ma jeszcze członków.</p>;
  }

  return (
    <ul className="border-t border-foreground" aria-label="Członkowie grupy">
      {members.map((member) => (
        <li
          key={member.id}
          className="flex flex-col gap-2 border-b border-border py-4 sm:flex-row sm:items-baseline sm:justify-between"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="font-serif text-xl leading-tight">
              {member.user.firstName} {member.user.lastName}
            </p>
            {member.role === "LEADER" && (
              <span className="border border-primary px-2 py-1 text-[11px] font-semibold leading-none text-primary">
                Lider
              </span>
            )}
          </div>
          <div className="text-sm leading-5 text-muted sm:text-right">
            <p>Numer albumu: {member.user.studentNumber ?? "brak danych"}</p>
            <p>{member.user.email ?? "Brak adresu e-mail"}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
