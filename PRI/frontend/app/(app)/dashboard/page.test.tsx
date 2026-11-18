import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import DashboardPage from "./page";

jest.mock("next/navigation", () => {
  const router = {
    replace: jest.fn(),
  };

  return {
    useRouter: () => router,
    __router: router,
  };
});

const router = (
  jest.requireMock("next/navigation") as {
    __router: {
      replace: jest.Mock;
    };
  }
).__router;

const fetchMock = jest.fn();

function response(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const user = {
  id: "123456",
  firstName: "Jan",
  lastName: "Kowalski",
};

beforeEach(() => {
  router.replace.mockReset();
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("DashboardPage", () => {
  it("pokazuje loading podczas pobierania dashboardu", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<DashboardPage />);

    expect(
      screen.getByText("Ładowanie dashboardu…"),
    ).toBeInTheDocument();
  });

  it("wyświetla dashboard po poprawnym pobraniu danych", async () => {
    fetchMock.mockResolvedValue(response(user));

    render(<DashboardPage />);

    expect(
      await screen.findByRole("heading", {
        name: "Pulpit: Jan Kowalski",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("123456")).toBeInTheDocument();
  });

  it("pokazuje czytelny błąd przy błędzie serwera", async () => {
    fetchMock.mockResolvedValue(response(null, 500));

    render(<DashboardPage />);

    expect(
      await screen.findByText(
        "Nie udało się załadować danych. Spróbuj ponownie.",
      ),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Spróbuj ponownie",
      }),
    ).toBeInTheDocument();
  });

  it("pokazuje czytelny błąd przy problemie z siecią", async () => {
    fetchMock.mockRejectedValue(new Error("network"));

    render(<DashboardPage />);

    expect(
      await screen.findByText(
        "Nie udało się załadować danych. Spróbuj ponownie.",
      ),
    ).toBeInTheDocument();
  });

  it("ponawia pobieranie danych i wyświetla dashboard", async () => {
    fetchMock.mockResolvedValue(response(null, 500));

    render(<DashboardPage />);

    const retry = await screen.findByRole("button", {
      name: "Spróbuj ponownie",
    });

    fetchMock.mockResolvedValue(response(user));

    fireEvent.click(retry);

    expect(
      await screen.findByRole("heading", {
        name: "Pulpit: Jan Kowalski",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByText(
        "Nie udało się załadować danych. Spróbuj ponownie.",
      ),
    ).not.toBeInTheDocument();
  });

  it("blokuje przycisk podczas ponawiania", async () => {
    fetchMock.mockResolvedValue(response(null, 500));

    render(<DashboardPage />);

    const retry = await screen.findByRole("button", {
      name: "Spróbuj ponownie",
    });

    fetchMock.mockReturnValue(new Promise(() => {}));

    fireEvent.click(retry);

    await waitFor(() => {
      expect(retry).toBeDisabled();
    });
  });

  it("przekierowuje do logowania po wygaśnięciu sesji", async () => {
    fetchMock.mockResolvedValue(response(null, 401));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(router.replace).toHaveBeenCalledWith(
        "/login?error=session_expired",
      );
    });
  });
});