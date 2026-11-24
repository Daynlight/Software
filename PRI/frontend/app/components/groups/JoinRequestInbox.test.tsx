import { fireEvent, render, screen } from "@testing-library/react";
import {
  acceptJoinRequest,
  JoinRequest,
  listJoinRequests,
  rejectJoinRequest,
} from "../../lib/groups-client";
import JoinRequestInbox from "./JoinRequestInbox";

jest.mock("../../lib/groups-client", () => ({
  listJoinRequests: jest.fn(),
  acceptJoinRequest: jest.fn(),
  rejectJoinRequest: jest.fn(),
}));

const listMock = listJoinRequests as jest.MockedFunction<typeof listJoinRequests>;
const acceptMock = acceptJoinRequest as jest.MockedFunction<
  typeof acceptJoinRequest
>;
const rejectMock = rejectJoinRequest as jest.MockedFunction<
  typeof rejectJoinRequest
>;

const request: JoinRequest = {
  id: "request-1",
  status: "PENDING",
  createdAt: "2026-11-23T10:00:00.000Z",
  decidedAt: null,
  user: {
    id: "user-2",
    firstName: "Anna",
    lastName: "Nowak",
    studentNumber: "S2",
    email: "anna@example.com",
  },
};

function listPage(items: JoinRequest[]) {
  return { items, page: 1, limit: 100, total: items.length, totalPages: 1 };
}

beforeEach(() => {
  listMock.mockReset();
  acceptMock.mockReset();
  rejectMock.mockReset();
});

describe("JoinRequestInbox", () => {
  it("shows the loading state", () => {
    listMock.mockReturnValue(new Promise(() => {}));

    render(<JoinRequestInbox groupId="group-1" />);

    expect(screen.getByRole("status")).toHaveTextContent("Pobieranie zgłoszeń…");
  });

  it("shows an empty state", async () => {
    listMock.mockResolvedValue(listPage([]));

    render(<JoinRequestInbox groupId="group-1" />);

    expect(await screen.findByText(/Brak oczekujących próśb/)).toBeInTheDocument();
    expect(listMock).toHaveBeenCalledWith("group-1", {
      status: "PENDING",
      limit: 100,
    });
  });

  it("loads requests and retries after an error", async () => {
    listMock.mockRejectedValueOnce(new Error("Brak sieci"));
    render(<JoinRequestInbox groupId="group-1" />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Brak sieci");

    listMock.mockResolvedValueOnce(listPage([request]));
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect(await screen.findByText("Anna Nowak")).toBeInTheDocument();
    expect(screen.getByText("Numer albumu: S2")).toBeInTheDocument();
    expect(screen.getByText("anna@example.com")).toBeInTheDocument();
    expect(screen.getByText(/Zgłoszenie z/)).toBeInTheDocument();
  });


  it("reports a retry failure", async () => {
    listMock.mockRejectedValueOnce(new Error("Brak sieci"));
    render(<JoinRequestInbox groupId="group-1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Brak sieci");

    listMock.mockRejectedValueOnce("boom");
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się pobrać zgłoszeń.",
    );

    listMock.mockRejectedValueOnce(new Error("Drugi błąd"));
    fireEvent.click(screen.getByRole("button", { name: "Spróbuj ponownie" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Drugi błąd");
  });

  it("accepts a request and shows warnings", async () => {
    const onChanged = jest.fn();
    listMock.mockResolvedValue(listPage([request]));
    acceptMock.mockResolvedValue({
      request,
      warnings: [{ code: "GROUP_IS_FULL", message: "Grupa jest pełna." }],
    });
    render(<JoinRequestInbox groupId="group-1" onChanged={onChanged} />);

    await screen.findByText("Anna Nowak");
    fireEvent.click(screen.getByRole("button", { name: "Akceptuj" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Grupa jest pełna.");
    expect(screen.queryByText("Anna Nowak")).not.toBeInTheDocument();
    expect(acceptMock).toHaveBeenCalledWith("group-1", "request-1");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("confirms an acceptance without warnings", async () => {
    listMock.mockResolvedValue(listPage([request]));
    acceptMock.mockResolvedValue({ request, warnings: [] });
    render(<JoinRequestInbox groupId="group-1" />);

    await screen.findByText("Anna Nowak");
    fireEvent.click(screen.getByRole("button", { name: "Akceptuj" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Dodano Anna Nowak do grupy.",
    );
  });

  it("shows the processing state", async () => {
    listMock.mockResolvedValue(listPage([request]));
    acceptMock.mockReturnValue(new Promise(() => {}));
    render(<JoinRequestInbox groupId="group-1" />);

    await screen.findByText("Anna Nowak");
    fireEvent.click(screen.getByRole("button", { name: "Akceptuj" }));

    expect(
      screen.getByRole("button", { name: "Przetwarzanie…" }),
    ).toBeDisabled();
  });

  it("reports accept errors", async () => {
    listMock.mockResolvedValue(listPage([request]));
    acceptMock.mockRejectedValueOnce(new Error("Nie można zaakceptować"));
    const { rerender } = render(<JoinRequestInbox groupId="group-1" />);

    await screen.findByText("Anna Nowak");
    fireEvent.click(screen.getByRole("button", { name: "Akceptuj" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie można zaakceptować",
    );

    acceptMock.mockRejectedValueOnce("boom");
    rerender(<JoinRequestInbox groupId="group-1" />);
    await screen.findByText("Anna Nowak");
    fireEvent.click(screen.getByRole("button", { name: "Akceptuj" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się zaakceptować.",
    );
  });

  it("requires confirmation before rejecting", async () => {
    listMock.mockResolvedValue(listPage([request]));
    rejectMock.mockResolvedValue({ request, warnings: [] });
    const onChanged = jest.fn();
    render(<JoinRequestInbox groupId="group-1" onChanged={onChanged} />);

    await screen.findByText("Anna Nowak");
    fireEvent.click(screen.getByRole("button", { name: "Odrzuć" }));
    expect(
      screen.getByRole("button", { name: "Potwierdź odrzucenie" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Anuluj" }));
    expect(screen.queryByRole("button", { name: "Potwierdź odrzucenie" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Odrzuć" }));
    fireEvent.click(screen.getByRole("button", { name: "Potwierdź odrzucenie" }));

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Odrzucono prośbę Anna Nowak.",
    );
    expect(rejectMock).toHaveBeenCalledWith("group-1", "request-1");
    expect(onChanged).toHaveBeenCalledTimes(1);
  });


  it("uses fallbacks for incomplete user data", async () => {
    listMock.mockResolvedValue(
      listPage([
        {
          ...request,
          user: {
            ...request.user,
            studentNumber: null,
            email: null,
          },
        },
      ]),
    );

    render(<JoinRequestInbox groupId="group-1" />);

    expect(await screen.findByText("Numer albumu: brak danych")).toBeInTheDocument();
    expect(screen.getByText("Brak adresu e-mail")).toBeInTheDocument();
  });

  it("uses fallback messages for non-error load and reject failures", async () => {
    listMock.mockRejectedValueOnce("boom");
    const { unmount } = render(<JoinRequestInbox groupId="group-1" />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się pobrać zgłoszeń.",
    );
    unmount();

    listMock.mockResolvedValueOnce(listPage([request]));
    rejectMock.mockRejectedValueOnce("boom");
    render(<JoinRequestInbox groupId="group-1" />);
    await screen.findByText("Anna Nowak");
    fireEvent.click(screen.getByRole("button", { name: "Odrzuć" }));
    fireEvent.click(screen.getByRole("button", { name: "Potwierdź odrzucenie" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie udało się odrzucić.",
    );
  });

  it("reports reject errors", async () => {
    listMock.mockResolvedValue(listPage([request]));
    rejectMock.mockRejectedValueOnce(new Error("Nie można odrzucić"));
    render(<JoinRequestInbox groupId="group-1" />);

    await screen.findByText("Anna Nowak");
    fireEvent.click(screen.getByRole("button", { name: "Odrzuć" }));
    fireEvent.click(screen.getByRole("button", { name: "Potwierdź odrzucenie" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Nie można odrzucić",
    );
  });
});
