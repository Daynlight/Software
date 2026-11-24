import { fireEvent, render, screen } from "@testing-library/react";
import { GroupSummary, requestJoin } from "../../lib/groups-client";
import GroupJoinAction from "./GroupJoinAction";

jest.mock("../../lib/groups-client", () => ({
  requestJoin: jest.fn(),
}));

const requestJoinMock = requestJoin as jest.MockedFunction<typeof requestJoin>;

function group(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return {
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
    isMember: false,
    myRequestStatus: null,
    ...overrides,
  };
}

beforeEach(() => {
  requestJoinMock.mockReset();
});

describe("GroupJoinAction", () => {
  it("links members to their group", () => {
    render(<GroupJoinAction group={group({ isMember: true })} />);

    expect(screen.getByText("Należysz do tej grupy")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Przejdź do grupy" })).toHaveAttribute(
      "href",
      "/moja-grupa",
    );
    expect(
      screen.queryByRole("button", { name: "Poproś o dołączenie" }),
    ).not.toBeInTheDocument();
  });

  it("shows an existing pending request", () => {
    render(<GroupJoinAction group={group({ myRequestStatus: "PENDING" })} />);

    expect(screen.getByText("Prośba oczekuje")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("explains why joining is disabled", () => {
    const { rerender } = render(<GroupJoinAction group={group()} disabled />);

    expect(
      screen.getByText("Nie możesz teraz dołączyć do grupy."),
    ).toBeInTheDocument();

    rerender(
      <GroupJoinAction
        group={group()}
        disabled
        disabledReason="Tylko studenci."
      />,
    );
    expect(screen.getByText("Tylko studenci.")).toBeInTheDocument();
  });

  it("warns about a full or large group before joining", () => {
    const { rerender } = render(
      <GroupJoinAction group={group({ isFull: true, isLarge: true })} />,
    );

    expect(screen.getByText(/Grupa jest pełna/)).toBeInTheDocument();
    expect(screen.queryByText(/To duża grupa/)).not.toBeInTheDocument();

    rerender(<GroupJoinAction group={group({ isLarge: true })} />);
    expect(screen.getByText(/To duża grupa/)).toBeInTheDocument();
  });

  it("sends a request and shows warnings", async () => {
    requestJoinMock.mockResolvedValue({
      request: {
        id: "request-1",
        status: "PENDING",
        createdAt: "2026-11-23T10:00:00.000Z",
        decidedAt: null,
        user: {
          id: "user-2",
          firstName: "Anna",
          lastName: "Nowak",
          studentNumber: "S2",
          email: null,
        },
      },
      warnings: [{ code: "GROUP_IS_LARGE", message: "To duża grupa." }],
    });

    render(<GroupJoinAction group={group()} />);
    fireEvent.click(screen.getByRole("button", { name: "Poproś o dołączenie" }));

    expect(await screen.findByText("Prośba oczekuje")).toBeInTheDocument();
    expect(screen.getByText("To duża grupa.")).toBeInTheDocument();
    expect(requestJoinMock).toHaveBeenCalledWith("group-1");
  });

  it("confirms a request without warnings", async () => {
    requestJoinMock.mockResolvedValue({
      request: {
        id: "request-1",
        status: "PENDING",
        createdAt: "2026-11-23T10:00:00.000Z",
        decidedAt: null,
        user: {
          id: "user-2",
          firstName: "Anna",
          lastName: "Nowak",
          studentNumber: "S2",
          email: null,
        },
      },
      warnings: [],
    });

    render(<GroupJoinAction group={group()} />);
    fireEvent.click(screen.getByRole("button", { name: "Poproś o dołączenie" }));

    expect(await screen.findByText("Prośba oczekuje")).toBeInTheDocument();
    expect(screen.queryByText("To duża grupa.")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Prośba oczekuje");
  });

  it("shows the sending state and an API error", async () => {
    let reject: (error: unknown) => void = () => undefined;
    requestJoinMock.mockReturnValue(
      new Promise((_resolve, rejectPromise) => {
        reject = rejectPromise;
      }),
    );

    render(<GroupJoinAction group={group()} />);
    fireEvent.click(screen.getByRole("button", { name: "Poproś o dołączenie" }));

    expect(screen.getByRole("button", { name: "Wysyłanie…" })).toBeDisabled();

    reject(new Error("Brak sieci"));
    expect(await screen.findByRole("alert")).toHaveTextContent("Brak sieci");
    expect(screen.getByRole("button", { name: "Poproś o dołączenie" })).toBeEnabled();
  });

  it("uses a default error message for non-error failures", async () => {
    requestJoinMock.mockRejectedValue("boom");

    render(<GroupJoinAction group={group()} />);
    fireEvent.click(screen.getByRole("button", { name: "Poproś o dołączenie" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się wysłać prośby. Spróbuj ponownie.",
    );
  });
});
