import { render, screen } from "@testing-library/react";
import { GroupSummary } from "../../lib/groups-client";
import GroupBoardRow from "./GroupBoardRow";

jest.mock("./GroupJoinAction", () => ({
  __esModule: true,
  default: ({ group }: { group: GroupSummary }) => (
    <div>akcja:{group.name}</div>
  ),
}));

function group(overrides: Partial<GroupSummary> = {}): GroupSummary {
  return {
    id: "group-1",
    name: "Zespół A",
    description: "Aplikacja do planowania zajęć.",
    leader: { id: "leader-1", firstName: "Jan", lastName: "Kowalski" },
    memberCount: 3,
    maxMembers: 6,
    recommendedMembers: 5,
    freeSlots: 3,
    isFull: false,
    isLarge: false,
    createdAt: "2026-11-23T10:00:00.000Z",
    isMember: false,
    myRequestStatus: null,
    ...overrides,
  };
}

describe("GroupBoardRow", () => {
  it("renders the group record, leader and composition", () => {
    render(<GroupBoardRow group={group()} canJoin />);

    expect(
      screen.getByRole("heading", { name: "Zespół A" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Aplikacja do planowania zajęć.")).toBeInTheDocument();
    expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("3 z 6 osób")).toBeInTheDocument();
    expect(screen.getByText("wolne miejsca")).toBeInTheDocument();
    expect(screen.getByText("akcja:Zespół A")).toBeInTheDocument();
  });

  it("marks a full group and hides the large-group badge", () => {
    render(
      <GroupBoardRow
        group={group({ isFull: true, isLarge: true, freeSlots: 0 })}
        canJoin={false}
        joinDisabledReason="Tylko studenci."
      />,
    );

    expect(screen.getByText("Komplet")).toBeInTheDocument();
    expect(screen.getByText("komplet")).toBeInTheDocument();
    expect(screen.queryByText("Duża grupa")).not.toBeInTheDocument();
  });

  it("marks a large group that is not full", () => {
    render(<GroupBoardRow group={group({ isLarge: true })} canJoin />);

    expect(screen.getByText("Duża grupa")).toBeInTheDocument();
    expect(screen.queryByText("Komplet")).not.toBeInTheDocument();
  });
});
