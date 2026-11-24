import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  GroupSearchResponse,
  GroupSummary,
  searchGroups,
} from "../../lib/groups-client";
import { useSessionUser } from "../../lib/use-session-user";
import GroupMarketPage from "./page";

const user = {
  id: "user-1",
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
  leader: { id: "leader-1", firstName: "Anna", lastName: "Nowak" },
  memberCount: 2,
  maxMembers: 6,
  recommendedMembers: 5,
  freeSlots: 4,
  isFull: false,
  isLarge: false,
  createdAt: "2026-11-23T10:00:00.000Z",
  isMember: false,
  myRequestStatus: null,
};

function page(overrides: Partial<GroupSearchResponse> = {}): GroupSearchResponse {
  return {
    items: [group],
    page: 1,
    limit: 10,
    total: 1,
    totalPages: 1,
    ...overrides,
  };
}

jest.mock("../../lib/use-session-user", () => ({
  useSessionUser: jest.fn(),
}));

jest.mock("../../lib/groups-client", () => ({
  searchGroups: jest.fn(),
}));

jest.mock("../../components/groups/GroupFilters", () => ({
  __esModule: true,
  default: ({
    onChange,
    onSubmit,
    onReset,
    values,
  }: {
    onChange: (values: unknown) => void;
    onSubmit: () => void;
    onReset: () => void;
    values: unknown;
  }) => (
    <div>
      <button type="button" onClick={() => onChange({ ...(values as object), search: "alpha" })}>
        zmień filtr
      </button>
      <button
        type="button"
        onClick={() =>
          onChange({
            ...(values as object),
            search: "",
            leader: "Nowak",
            hasFreeSlots: true,
            minFreeSlots: "2",
            sort: "freeSlots",
          })
        }
      >
        filtry zaawansowane
      </button>
      <button type="button" onClick={onSubmit}>
        zastosuj
      </button>
      <button type="button" onClick={onReset}>
        wyczyść
      </button>
    </div>
  ),
}));

jest.mock("../../components/groups/GroupBoardRow", () => ({
  __esModule: true,
  default: ({
    group: row,
    canJoin,
    joinDisabledReason,
  }: {
    group: GroupSummary;
    canJoin: boolean;
    joinDisabledReason?: string;
  }) => (
    <li>{`${row.name}|${canJoin ? "join" : "no-join"}|${
      canJoin ? "" : (joinDisabledReason ?? "")
    }`}</li>
  ),
}));

const useSessionUserMock = useSessionUser as jest.MockedFunction<
  typeof useSessionUser
>;
const searchGroupsMock = searchGroups as jest.MockedFunction<typeof searchGroups>;

beforeEach(() => {
  useSessionUserMock.mockReset();
  searchGroupsMock.mockReset();
  useSessionUserMock.mockReturnValue(user);
});

describe("GroupMarketPage", () => {
  it("shows the session loading state", () => {
    useSessionUserMock.mockReturnValue(null);
    searchGroupsMock.mockResolvedValue(page());

    render(<GroupMarketPage />);

    expect(screen.getByText("Sprawdzanie sesji…")).toBeInTheDocument();
    expect(searchGroupsMock).not.toHaveBeenCalled();
  });

  it("loads groups with default filters", async () => {
    searchGroupsMock.mockResolvedValue(page());

    render(<GroupMarketPage />);

    expect(screen.getByText("Pobieranie grup…")).toBeInTheDocument();
    expect(await screen.findByText("Zespół A|join|")).toBeInTheDocument();
    expect(screen.getByText("Liczba grup: 1")).toBeInTheDocument();
    expect(searchGroupsMock).toHaveBeenCalledWith({
      search: undefined,
      leader: undefined,
      hasFreeSlots: undefined,
      minFreeSlots: undefined,
      page: 1,
      limit: 10,
      sort: "createdAt",
      order: "desc",
    });
  });

  it("applies and resets filters", async () => {
    searchGroupsMock.mockResolvedValue(page());
    render(<GroupMarketPage />);
    await screen.findByText("Zespół A|join|");

    fireEvent.click(screen.getByRole("button", { name: "zmień filtr" }));
    fireEvent.click(screen.getByRole("button", { name: "zastosuj" }));

    await waitFor(() =>
      expect(searchGroupsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: "alpha", page: 1 }),
      ),
    );

    fireEvent.click(screen.getByRole("button", { name: "wyczyść" }));
    await waitFor(() =>
      expect(searchGroupsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: undefined, page: 1 }),
      ),
    );
    await screen.findByText("Zespół A|join|");
  });

  it("passes advanced filters to the API", async () => {
    searchGroupsMock.mockResolvedValue(page());
    render(<GroupMarketPage />);
    await screen.findByText("Zespół A|join|");

    fireEvent.click(screen.getByRole("button", { name: "filtry zaawansowane" }));
    fireEvent.click(screen.getByRole("button", { name: "zastosuj" }));

    await waitFor(() =>
      expect(searchGroupsMock).toHaveBeenLastCalledWith({
        search: undefined,
        leader: "Nowak",
        hasFreeSlots: true,
        minFreeSlots: 2,
        page: 1,
        limit: 10,
        sort: "freeSlots",
        order: "desc",
      }),
    );
    await screen.findByText("Zespół A|join|");
  });

  it("shows an empty state with a create link", async () => {
    searchGroupsMock.mockResolvedValue(
      page({ items: [], total: 0, totalPages: 0 }),
    );

    render(<GroupMarketPage />);

    expect(await screen.findByText("Nie ma jeszcze takiej grupy.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Utwórz pierwszą grupę" })).toHaveAttribute(
      "href",
      "/gielda/nowa",
    );
    expect(screen.getByText("Brak wyników")).toBeInTheDocument();
  });

  it("shows an error and retries", async () => {
    searchGroupsMock
      .mockRejectedValueOnce(new Error("Brak sieci"))
      .mockResolvedValueOnce(page());

    render(<GroupMarketPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Brak sieci");
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect(await screen.findByText("Zespół A|join|")).toBeInTheDocument();
  });

  it("uses a fallback error message", async () => {
    searchGroupsMock.mockRejectedValue("boom");

    render(<GroupMarketPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się pobrać grup.",
    );
  });

  it("paginates groups", async () => {
    searchGroupsMock.mockResolvedValue(
      page({ total: 2, totalPages: 2 }),
    );
    render(<GroupMarketPage />);
    await screen.findByText("Zespół A|join|");

    expect(screen.getByRole("button", { name: "Poprzednia" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Następna" }));

    await waitFor(() =>
      expect(searchGroupsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 2 }),
      ),
    );
    await screen.findByText("Zespół A|join|");

    fireEvent.click(screen.getByRole("button", { name: "Poprzednia" }));
    await waitFor(() =>
      expect(searchGroupsMock).toHaveBeenLastCalledWith(
        expect.objectContaining({ page: 1 }),
      ),
    );
    await screen.findByText("Zespół A|join|");
  });

  it("explains that non-students cannot join", async () => {
    useSessionUserMock.mockReturnValue({ ...user, role: "OTHER" });
    searchGroupsMock.mockResolvedValue(page());

    render(<GroupMarketPage />);

    expect(await screen.findByText(/Ta sesja nie ma uprawnień studenta/)).toBeInTheDocument();
    expect(await screen.findByText(/Zespół A\|no-join\|Tylko studenci/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Utwórz grupę" })).not.toBeInTheDocument();
  });
});
