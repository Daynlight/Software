import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GroupSummary, leaveGroup } from "../../lib/groups-client";
import LeaveGroupButton from "./LeaveGroupButton";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("../../lib/groups-client", () => ({
  leaveGroup: jest.fn(),
}));

const leaveGroupMock = leaveGroup as jest.MockedFunction<typeof leaveGroup>;

function group(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return {
    id: "group-1",
    name: "Zespół A",
    description: "Opis projektu",
    leader: { id: "leader-1", firstName: "Jan", lastName: "Kowalski" },
    memberCount: 3,
    maxMembers: 6,
    recommendedMembers: 5,
    freeSlots: 3,
    isFull: false,
    isLarge: false,
    createdAt: "2026-11-23T10:00:00.000Z",
    isMember: true,
    myRequestStatus: "ACCEPTED",
    ...overrides,
  };
}

beforeEach(() => {
  push.mockReset();
  leaveGroupMock.mockReset();
});

describe("LeaveGroupButton", () => {
  it("requires confirmation and can be cancelled", () => {
    render(<LeaveGroupButton group={group()} isLeader={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Opuść grupę" }));
    expect(screen.getByText(/nie będziesz już widzieć/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Anuluj" }));
    expect(
      screen.queryByRole("button", { name: "Potwierdź opuszczenie" }),
    ).not.toBeInTheDocument();
  });

  it("warns the leader about transferring leadership", () => {
    render(<LeaveGroupButton group={group()} isLeader />);

    fireEvent.click(screen.getByRole("button", { name: "Opuść grupę" }));

    expect(screen.getByText(/liderem zostanie losowo wybrany/)).toBeInTheDocument();
  });

  it("warns that leaving an empty group deletes it", () => {
    render(
      <LeaveGroupButton
        group={group({ memberCount: 1, freeSlots: 5 })}
        isLeader
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Opuść grupę" }));

    expect(screen.getByText(/trwałe usunięcie grupy/)).toBeInTheDocument();
  });

  it("leaves the group and redirects", async () => {
    leaveGroupMock.mockResolvedValue(undefined);
    render(<LeaveGroupButton group={group()} isLeader />);

    fireEvent.click(screen.getByRole("button", { name: "Opuść grupę" }));
    fireEvent.click(screen.getByRole("button", { name: "Potwierdź opuszczenie" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/gielda"));
    expect(leaveGroupMock).toHaveBeenCalledWith("group-1");
  });

  it("shows a loading state and an API error", async () => {
    let reject: (error: unknown) => void = () => undefined;
    leaveGroupMock.mockReturnValue(
      new Promise((_resolve, rejectPromise) => {
        reject = rejectPromise;
      }),
    );
    render(<LeaveGroupButton group={group()} isLeader={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Opuść grupę" }));
    fireEvent.click(screen.getByRole("button", { name: "Potwierdź opuszczenie" }));

    expect(screen.getByRole("button", { name: "Opuszczanie…" })).toBeDisabled();
    reject(new Error("Nie można opuścić"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Nie można opuścić");
  });

  it("uses a fallback error message", async () => {
    leaveGroupMock.mockRejectedValue("boom");
    render(<LeaveGroupButton group={group()} isLeader={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Opuść grupę" }));
    fireEvent.click(screen.getByRole("button", { name: "Potwierdź opuszczenie" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się opuścić grupy. Spróbuj ponownie.",
    );
  });
});
