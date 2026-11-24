import { act, renderHook, waitFor } from "@testing-library/react";
import { fetchMyGroup } from "./groups-client";
import { useMyGroup } from "./use-my-group";

jest.mock("./groups-client", () => ({
  fetchMyGroup: jest.fn(),
}));

const fetchMyGroupMock = fetchMyGroup as jest.MockedFunction<
  typeof fetchMyGroup
>;

beforeEach(() => {
  fetchMyGroupMock.mockReset();
});

describe("useMyGroup", () => {
  it("stays idle without a user", () => {
    const { result } = renderHook(() => useMyGroup(null));

    expect(result.current.status).toBe("idle");
    expect(fetchMyGroupMock).not.toHaveBeenCalled();
  });

  it("loads the current group", async () => {
    fetchMyGroupMock.mockResolvedValue({ id: "group-1" } as never);

    const { result } = renderHook(() => useMyGroup("user-1"));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.group).toEqual({ id: "group-1" });
    expect(result.current.error).toBeNull();
  });

  it("handles a user without a group", async () => {
    fetchMyGroupMock.mockResolvedValue(null);

    const { result } = renderHook(() => useMyGroup("user-1"));

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.group).toBeNull();
  });

  it("exposes an error and retries", async () => {
    fetchMyGroupMock.mockRejectedValueOnce(new Error("Brak sieci"));
    const { result } = renderHook(() => useMyGroup("user-1"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("Brak sieci");

    fetchMyGroupMock.mockResolvedValue(null);
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe("ready");
  });

  it("uses a fallback for non-error failures", async () => {
    fetchMyGroupMock.mockRejectedValue("boom");

    const { result } = renderHook(() => useMyGroup("user-1"));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("Nie udało się pobrać Twojej grupy.");
  });


  it("reports refresh failures with a fallback", async () => {
    fetchMyGroupMock.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useMyGroup("user-1"));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    fetchMyGroupMock.mockRejectedValueOnce("boom");
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe("Nie udało się pobrać Twojej grupy.");

    fetchMyGroupMock.mockRejectedValueOnce(new Error("Drugi błąd"));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.error).toBe("Drugi błąd");
  });

  it("clears the state when the user disappears", async () => {
    fetchMyGroupMock.mockResolvedValue(null);
    const { result, rerender } = renderHook(
      ({ userId }: { userId: string | null }) => useMyGroup(userId),
      { initialProps: { userId: "user-1" as string | null } },
    );

    await waitFor(() => expect(result.current.status).toBe("ready"));
    rerender({ userId: null });

    await waitFor(() => expect(result.current.status).toBe("idle"));
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.status).toBe("idle");
  });
});
