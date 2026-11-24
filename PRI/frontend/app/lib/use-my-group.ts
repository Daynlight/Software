"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchMyGroup, GroupSummary } from "./groups-client";

export type MyGroupStatus = "idle" | "loading" | "ready" | "error";

export interface MyGroupState {
  status: MyGroupStatus;
  group: GroupSummary | null;
  error: string | null;
  refresh: () => Promise<void>;
}

const errorMessage = "Nie udało się pobrać Twojej grupy.";

export function useMyGroup(userId: string | null): MyGroupState {
  const [state, setState] = useState<{
    status: MyGroupStatus;
    group: GroupSummary | null;
    error: string | null;
  }>({ status: "idle", group: null, error: null });

  const refresh = useCallback(async () => {
    if (!userId) {
      return;
    }

    setState({ status: "loading", group: null, error: null });

    try {
      setState({
        status: "ready",
        group: await fetchMyGroup(),
        error: null,
      });
    } catch (cause) {
      setState({
        status: "error",
        group: null,
        error: cause instanceof Error ? cause.message : errorMessage,
      });
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    let active = true;
    void fetchMyGroup()
      .then((group) => {
        if (active) {
          setState({ status: "ready", group, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setState({
            status: "error",
            group: null,
            error: cause instanceof Error ? cause.message : errorMessage,
          });
        }
      });

    return () => {
      active = false;
    };
  }, [userId]);

  if (!userId) {
    return { status: "idle", group: null, error: null, refresh };
  }

  return { ...state, refresh };
}
