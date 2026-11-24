import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GroupSummary, updateGroup } from "../../lib/groups-client";
import GroupEditForm from "./GroupEditForm";

jest.mock("../../lib/groups-client", () => ({
  updateGroup: jest.fn(),
}));

const updateGroupMock = updateGroup as jest.MockedFunction<typeof updateGroup>;

function group(): GroupSummary {
  return {
    id: "group-1",
    name: "Zespół A",
    description: "Opis projektu inżynierskiego",
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
  };
}

beforeEach(() => {
  updateGroupMock.mockReset();
});

describe("GroupEditForm", () => {
  it("saves edited name and description", async () => {
    const onUpdated = jest.fn();
    const updated = { ...group(), name: "Nowa nazwa" };
    updateGroupMock.mockResolvedValue(updated);
    render(
      <GroupEditForm
        group={group()}
        onCancel={jest.fn()}
        onUpdated={onUpdated}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nazwa grupy"), {
      target: { value: "  Nowa nazwa  " },
    });
    fireEvent.change(screen.getByLabelText("Opis projektu"), {
      target: { value: "  Nowy opis projektu  " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(updated));
    expect(updateGroupMock).toHaveBeenCalledWith("group-1", {
      name: "Nowa nazwa",
      description: "Nowy opis projektu",
    });
  });

  it("validates name and description before saving", () => {
    render(
      <GroupEditForm
        group={group()}
        onCancel={jest.fn()}
        onUpdated={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Nazwa grupy"), {
      target: { value: "x" },
    });
    fireEvent.change(screen.getByLabelText("Opis projektu"), {
      target: { value: "krótki" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    expect(screen.getByText("Nazwa musi mieć co najmniej 3 znaki.")).toBeInTheDocument();
    expect(screen.getByText("Opis musi mieć co najmniej 10 znaków.")).toBeInTheDocument();
    expect(updateGroupMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nazwa grupy")).toHaveFocus();
  });

  it("focuses the description when only it is invalid", () => {
    render(
      <GroupEditForm
        group={group()}
        onCancel={jest.fn()}
        onUpdated={jest.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText("Opis projektu"), {
      target: { value: "krótki" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    expect(screen.getByLabelText("Opis projektu")).toHaveFocus();
  });

  it("shows API and fallback errors", async () => {
    updateGroupMock.mockRejectedValueOnce(new Error("Brak uprawnień"));
    const { rerender } = render(
      <GroupEditForm
        group={group()}
        onCancel={jest.fn()}
        onUpdated={jest.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Nazwa grupy"), {
      target: { value: "Nowa nazwa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Brak uprawnień");

    updateGroupMock.mockRejectedValueOnce("boom");
    rerender(
      <GroupEditForm
        group={group()}
        onCancel={jest.fn()}
        onUpdated={jest.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("Nazwa grupy"), {
      target: { value: "Inna nazwa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się zapisać zmian. Spróbuj ponownie.",
    );
  });

  it("shows the submitting state and cancels", async () => {
    updateGroupMock.mockReturnValue(new Promise(() => {}));
    const onCancel = jest.fn();
    render(
      <GroupEditForm
        group={group()}
        onCancel={onCancel}
        onUpdated={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Zapisz zmiany" }));
    expect(screen.getByRole("button", { name: "Zapisywanie…" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Anuluj" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
