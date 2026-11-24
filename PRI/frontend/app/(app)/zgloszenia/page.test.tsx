import { fireEvent, render, screen } from "@testing-library/react";
import { GroupSummary } from "../../lib/groups-client";
import { useMyGroup } from "../../lib/use-my-group";
import { useSessionUser } from "../../lib/use-session-user";
import JoinRequestsPage from "./page";

jest.mock("../../lib/use-session-user", () => ({
  useSessionUser: jest.fn(),
}));

jest.mock("../../lib/use-my-group", () => ({
  useMyGroup: jest.fn(),
}));

jest.mock("../../components/groups/JoinRequestInbox", () => ({
  __esModule: true,
  default: ({
    groupId,
    onChanged,
  }: {
    groupId: string;
    onChanged?: () => void;
  }) => (
    <button type="button" onClick={onChanged}>
      inbox:{groupId}
    </button>
  ),
}));

const useSessionUserMock = useSessionUser as jest.MockedFunction<
  typeof useSessionUser
>;
const useMyGroupMock = useMyGroup as jest.MockedFunction<typeof useMyGroup>;

const user = {
  id: "leader-1",
  firstName: "Jan",
  lastName: "Kowalski",
  studentNumber: "S1",
  email: "jan@example.com",
  photoUrl: null,
  role: "STUDENT" as const,
};

const group: GroupSummary = {
  id: "group-1",
  name: "Zespół A",
  description: "Opis projektu",
  leader: { id: "leader-1", firstName: "Jan", lastName: "Kowalski" },
  memberCount: 5,
  maxMembers: 6,
  recommendedMembers: 5,
  freeSlots: 1,
  isFull: false,
  isLarge: true,
  createdAt: "2026-11-23T10:00:00.000Z",
  isMember: true,
  myRequestStatus: "ACCEPTED",
};

function state(overrides: Partial<ReturnType<typeof useMyGroup>> = {}) {
  return {
    status: "ready" as const,
    group,
    error: null,
    refresh: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  useSessionUserMock.mockReset();
  useMyGroupMock.mockReset();
  useSessionUserMock.mockReturnValue(user);
  useMyGroupMock.mockReturnValue(state());
});

describe("JoinRequestsPage", () => {
  it("shows the session loading state", () => {
    useSessionUserMock.mockReturnValue(null);

    render(<JoinRequestsPage />);

    expect(screen.getByText("Sprawdzanie sesji…")).toBeInTheDocument();
  });

  it("shows loading for idle and loading states", () => {
    useMyGroupMock.mockReturnValue(state({ status: "idle", group: null }));
    const { rerender } = render(<JoinRequestsPage />);

    expect(screen.getByText("Pobieranie zgłoszeń…")).toBeInTheDocument();
    useMyGroupMock.mockReturnValue(state({ status: "loading", group: null }));
    rerender(<JoinRequestsPage />);
    expect(screen.getByText("Pobieranie zgłoszeń…")).toBeInTheDocument();
  });

  it("shows an error and retries", () => {
    const refresh = jest.fn();
    useMyGroupMock.mockReturnValue(
      state({ status: "error", group: null, error: "Brak sieci", refresh }),
    );

    render(<JoinRequestsPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Brak sieci");
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("uses a fallback error message", () => {
    useMyGroupMock.mockReturnValue(
      state({ status: "error", group: null, error: null }),
    );

    render(<JoinRequestsPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Nie udało się pobrać zgłoszeń.",
    );
  });

  it("asks a user without a group to join one first", () => {
    useMyGroupMock.mockReturnValue(state({ group: null }));

    render(<JoinRequestsPage />);

    expect(
      screen.getByRole("heading", { name: "Najpierw dołącz do grupy." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Przejdź do giełdy" })).toHaveAttribute(
      "href",
      "/gielda",
    );
  });

  it("explains that only the leader sees requests", () => {
    useMyGroupMock.mockReturnValue(
      state({
        group: {
          ...group,
          leader: { id: "other", firstName: "Anna", lastName: "Nowak" },
        },
      }),
    );

    render(<JoinRequestsPage />);

    expect(
      screen.getByRole("heading", { name: "Zgłoszenia widzi lider." }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Należysz do grupy „Zespół A”/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wróć do mojej grupy" })).toHaveAttribute(
      "href",
      "/moja-grupa",
    );
  });

  it("shows the leader inbox and free slots", () => {
    const refresh = jest.fn();
    useMyGroupMock.mockReturnValue(state({ refresh }));

    render(<JoinRequestsPage />);

    expect(
      screen.getByRole("heading", { name: /Kto chce dołączyć do „Zespół A”/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Wolne miejsca: 1/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "inbox:group-1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "inbox:group-1" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("shows a full group state", () => {
    useMyGroupMock.mockReturnValue(
      state({ group: { ...group, isFull: true, freeSlots: 0 } }),
    );

    render(<JoinRequestsPage />);

    expect(screen.getByText(/Grupa jest pełna/)).toBeInTheDocument();
  });
});
