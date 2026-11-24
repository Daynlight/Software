import { fireEvent, render, screen } from "@testing-library/react";
import { getGroupMembers } from "../../lib/groups-client";
import GroupMembers from "./GroupMembers";

jest.mock("../../lib/groups-client", () => ({
  getGroupMembers: jest.fn(),
}));

const getMembersMock = getGroupMembers as jest.MockedFunction<
  typeof getGroupMembers
>;

const leader = {
  id: "member-1",
  role: "LEADER" as const,
  joinedAt: "2026-11-23T10:00:00.000Z",
  user: {
    id: "user-1",
    firstName: "Jan",
    lastName: "Kowalski",
    studentNumber: "S1",
    email: "jan@example.com",
  },
};

const member = {
  id: "member-2",
  role: "MEMBER" as const,
  joinedAt: "2026-11-23T11:00:00.000Z",
  user: {
    id: "user-2",
    firstName: "Anna",
    lastName: "Nowak",
    studentNumber: null,
    email: null,
  },
};

beforeEach(() => {
  getMembersMock.mockReset();
});

describe("GroupMembers", () => {
  it("shows the loading state", () => {
    getMembersMock.mockReturnValue(new Promise(() => {}));

    render(<GroupMembers groupId="group-1" />);

    expect(screen.getByRole("status")).toHaveTextContent("Pobieranie składu…");
  });

  it("renders the roster with the leader marker", async () => {
    getMembersMock.mockResolvedValue([leader, member]);

    render(<GroupMembers groupId="group-1" />);

    expect(await screen.findByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("Lider")).toBeInTheDocument();
    expect(screen.getByText("Anna Nowak")).toBeInTheDocument();
    expect(screen.getByText("Numer albumu: S1")).toBeInTheDocument();
    expect(screen.getByText("jan@example.com")).toBeInTheDocument();
    expect(screen.getByText("Numer albumu: brak danych")).toBeInTheDocument();
    expect(screen.getByText("Brak adresu e-mail")).toBeInTheDocument();
    expect(getMembersMock).toHaveBeenCalledWith("group-1");
  });

  it("shows an empty state", async () => {
    getMembersMock.mockResolvedValue([]);

    render(<GroupMembers groupId="group-1" />);

    expect(await screen.findByText("Grupa nie ma jeszcze członków.")).toBeInTheDocument();
  });

  it("shows an error and retries", async () => {
    getMembersMock
      .mockRejectedValueOnce(new Error("Brak sieci"))
      .mockResolvedValueOnce([leader]);
    render(<GroupMembers groupId="group-1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Brak sieci");
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect(await screen.findByText("Jan Kowalski")).toBeInTheDocument();
  });

  it("uses a fallback error and reports retry failures", async () => {
    getMembersMock.mockRejectedValueOnce("boom");
    render(<GroupMembers groupId="group-1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się pobrać składu grupy.",
    );

    getMembersMock.mockRejectedValueOnce(new Error("Drugi błąd"));
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Drugi błąd");

    getMembersMock.mockRejectedValueOnce("boom");
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się pobrać składu grupy.",
    );
  });
});
