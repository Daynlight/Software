"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchCurrentUser, UsosUser } from "./session-client";

export function useSessionUser(): UsosUser | null {
  const router = useRouter();
  const [user, setUser] = useState<UsosUser | null>(null);

  useEffect(() => {
    void fetchCurrentUser().then((current) => {
      if (!current) {
        router.replace("/login");
        return;
      }

      setUser(current);
    });
  }, [router]);

  return user;
}
