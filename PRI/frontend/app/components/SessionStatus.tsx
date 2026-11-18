"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchCurrentUser, logout, UsosUser } from "../lib/session-client";

type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "authenticated"; user: UsosUser };

const actionClass =
  "font-medium underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-foreground";

export default function SessionStatus() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    void fetchCurrentUser().then((user) => {
      setSession(
        user ? { status: "authenticated", user } : { status: "anonymous" },
      );
    });
  }, []);

  async function handleLogout(): Promise<void> {
    await logout();
    setSession({ status: "anonymous" });
    router.push("/login");
  }

  if (session.status === "loading") {
    return null;
  }

  if (session.status === "anonymous") {
    return (
      <Link href="/login" className={actionClass}>
        Zaloguj
      </Link>
    );
  }

  return (
    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <span>
        {session.user.firstName} {session.user.lastName}
      </span>
      <button
        type="button"
        onClick={() => void handleLogout()}
        className={actionClass}
      >
        Wyloguj
      </button>
    </span>
  );
}
