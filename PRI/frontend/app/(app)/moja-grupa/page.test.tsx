import { fireEvent, render, screen } from "@testing-library/react";
import { GroupSummary } from "../../lib/groups-client";
import { useMyGroup } from "../../lib/use-my-group";
import { useSessionUser } from "../../lib/use-session-user";
import MyGroupPage from "./page";

jest.mock("../../lib/use-session-user", () => ({
  useSessionUser: jest.fn(),
}));

jest.mock("../../lib/use-my-group", () => ({
  useMyGroup: jest.fn(),
}));

jest.mock("../../components/groups/GroupEditForm", () => ({
  __esModule: true,
  default: ({
    onCancel,
    onUpdated,
  }: {
    onCancel: () => void;
    onUpdated: () => void;
  }) => (
    <div>
      <button type="button" onClick={onUpdated}>
        save-edit
      </button>
      <button type="button" onClick={onCancel}>
        cancel-edit
      </button>
    </div>
  ),
}));

jest.mock("../../components/groups/LeaveGroupButton", () => ({
  __esModule: true,
  default: ({ isLeader }: { isLeader: boolean }) => (
    <div>leave:{String(isLeader)}</div>
  ),
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
  memberCount: 2,
  maxMembers: 6,
  recommendedMembers: 5,
  freeSlots: 4,
  isFull: false,
  isLarge: false,
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

describe("MyGroupPage", () => {
  it("shows the session loading state", () => {
    useSessionUserMock.mockReturnValue(null);

    render(<MyGroupPage />);

    expect(screen.getByText("Sprawdzanie sesji…")).toBeInTheDocument();
  });

  it("shows loading for an idle or loading group", () => {
    useMyGroupMock.mockReturnValue(state({ status: "idle", group: null }));
    const { rerender } = render(<MyGroupPage />);

    expect(screen.getByText("Pobieranie Twojej grupy…")).toBeInTheDocument();

    useMyGroupMock.mockReturnValue(state({ status: "loading", group: null }));
    rerender(<MyGroupPage />);
    expect(screen.getByText("Pobieranie Twojej grupy…")).toBeInTheDocument();
  });

  it("shows an error with a retry action", () => {
    const refresh = jest.fn();
    useMyGroupMock.mockReturnValue(
      state({ status: "error", group: null, error: "Brak sieci", refresh }),
    );

    render(<MyGroupPage />);
    expect(screen.getByRole("alert")).toHaveTextContent("Brak sieci");

    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("uses a fallback error message", () => {
    useMyGroupMock.mockReturnValue(
      state({ status: "error", group: null, error: null }),
    );

    render(<MyGroupPage />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Nie udało się pobrać Twojej grupy.",
    );
  });

  it("invites a user without a group to the market", () => {
    useMyGroupMock.mockReturnValue(state({ group: null }));

    render(<MyGroupPage />);

    expect(
      screen.getByRole("heading", { name: "Nie masz jeszcze grupy." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Przejdź do giełdy" })).toHaveAttribute(
      "href",
      "/gielda",
    );
    expect(screen.getByRole("link", { name: "Utwórz grupę" })).toHaveAttribute(
      "href",
      "/gielda/nowa",
    );
  });

  it("shows the leader view with the request inbox", () => {
    const refresh = jest.fn();
    useMyGroupMock.mockReturnValue(state({ refresh }));

    render(<MyGroupPage />);

    expect(screen.getByRole("heading", { name: "Zespół A" })).toBeInTheDocument();
    expect(screen.getByText("Oczekujące prośby")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "inbox:group-1" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Otwórz pełną listę" })).toHaveAttribute(
      "href",
      "/zgloszenia",
    );
    expect(screen.getByText("leave:true")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "inbox:group-1" }));
    expect(refresh).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Edytuj dane" }));
    expect(screen.getByRole("button", { name: "save-edit" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "save-edit" }));
    expect(refresh).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "Edytuj dane" }));
    fireEvent.click(screen.getByRole("button", { name: "cancel-edit" }));
    expect(screen.queryByRole("button", { name: "save-edit" })).not.toBeInTheDocument();
  });

  it("shows the member view without the inbox", () => {
    useMyGroupMock.mockReturnValue(
      state({
        group: {
          ...group,
          leader: { id: "other", firstName: "Anna", lastName: "Nowak" },
        },
      }),
    );

    render(<MyGroupPage />);

    expect(screen.getByText("członek")).toBeInTheDocument();
    expect(screen.getByText("leave:false")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edytuj dane" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /inbox/ })).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Zobacz inne grupy" }),
    ).toHaveAttribute("href", "/gielda");
  });

  it("shows the full group state", () => {
    useMyGroupMock.mockReturnValue(
      state({ group: { ...group, isFull: true, freeSlots: 0 } }),
    );

    render(<MyGroupPage />);

    expect(screen.getByText("komplet")).toBeInTheDocument();
  });
});
