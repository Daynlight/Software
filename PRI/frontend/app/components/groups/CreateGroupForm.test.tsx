import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createGroup } from "../../lib/groups-client";
import CreateGroupForm from "./CreateGroupForm";

const push = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

jest.mock("../../lib/groups-client", () => ({
  createGroup: jest.fn(),
}));

const createGroupMock = createGroup as jest.MockedFunction<typeof createGroup>;

beforeEach(() => {
  push.mockReset();
  createGroupMock.mockReset();
});

function fill(name: string, description: string): void {
  fireEvent.change(screen.getByLabelText("Nazwa grupy"), {
    target: { value: name },
  });
  fireEvent.change(screen.getByLabelText("Opis projektu"), {
    target: { value: description },
  });
}

describe("CreateGroupForm", () => {
  it("validates short fields and does not call the API", () => {
    render(<CreateGroupForm />);

    fireEvent.click(screen.getByRole("button", { name: "Utwórz grupę" }));

    expect(screen.getByText("Nazwa musi mieć co najmniej 3 znaki.")).toBeInTheDocument();
    expect(
      screen.getByText("Opis musi mieć co najmniej 10 znaków."),
    ).toBeInTheDocument();
    expect(createGroupMock).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Nazwa grupy")).toHaveFocus();
  });


  it("focuses the description when only it is invalid", () => {
    render(<CreateGroupForm />);
    fireEvent.change(screen.getByLabelText("Nazwa grupy"), {
      target: { value: "Zespół A" },
    });
    fireEvent.change(screen.getByLabelText("Opis projektu"), {
      target: { value: "krótki" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Utwórz grupę" }));

    expect(screen.getByLabelText("Opis projektu")).toHaveFocus();
  });

  it("validates fields that are too long", () => {
    render(<CreateGroupForm />);
    fill("a".repeat(101), "b".repeat(2001));

    fireEvent.click(screen.getByRole("button", { name: "Utwórz grupę" }));

    expect(
      screen.getByText("Nazwa może mieć najwyżej 100 znaków."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Opis może mieć najwyżej 2000 znaków."),
    ).toBeInTheDocument();
  });

  it("creates a group with trimmed values and redirects", async () => {
    createGroupMock.mockResolvedValue({} as never);
    render(<CreateGroupForm />);
    fill("  Zespół A  ", "  Opis projektu inżynierskiego  ");

    fireEvent.click(screen.getByRole("button", { name: "Utwórz grupę" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/moja-grupa"));
    expect(createGroupMock).toHaveBeenCalledWith({
      name: "Zespół A",
      description: "Opis projektu inżynierskiego",
    });
  });

  it("shows the submitting state", async () => {
    createGroupMock.mockReturnValue(new Promise(() => {}));
    render(<CreateGroupForm />);
    fill("Zespół A", "Opis projektu inżynierskiego");

    fireEvent.click(screen.getByRole("button", { name: "Utwórz grupę" }));

    expect(
      screen.getByRole("button", { name: "Tworzenie…" }),
    ).toBeDisabled();
  });

  it("shows API and fallback errors", async () => {
    createGroupMock.mockRejectedValueOnce(new Error("Jesteś już w grupie"));
    const { rerender } = render(<CreateGroupForm />);
    fill("Zespół A", "Opis projektu inżynierskiego");
    fireEvent.click(screen.getByRole("button", { name: "Utwórz grupę" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Jesteś już w grupie",
    );
    expect(screen.getByRole("button", { name: "Utwórz grupę" })).toBeEnabled();

    createGroupMock.mockRejectedValueOnce("boom");
    rerender(<CreateGroupForm />);
    fill("Zespół B", "Inny opis projektu");
    fireEvent.click(screen.getByRole("button", { name: "Utwórz grupę" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się utworzyć grupy. Spróbuj ponownie.",
    );
  });

  it("clears field errors while editing and links back", () => {
    render(<CreateGroupForm />);
    fireEvent.click(screen.getByRole("button", { name: "Utwórz grupę" }));
    fireEvent.change(screen.getByLabelText("Nazwa grupy"), {
      target: { value: "Zespół" },
    });
    fireEvent.change(screen.getByLabelText("Opis projektu"), {
      target: { value: "Opis projektu" },
    });

    expect(
      screen.queryByText("Nazwa musi mieć co najmniej 3 znaki."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Opis musi mieć co najmniej 10 znaków."),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wróć do giełdy" })).toHaveAttribute(
      "href",
      "/gielda",
    );
  });
});
