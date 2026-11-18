import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ProfileDetails from "./ProfileDetails";

const replace = jest.fn();

const routerMock = {
  replace,
};

jest.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

const fetchMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
  }),
}));

function response(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const user = {
  id: "123",
  firstName: "Jan",
  lastName: "Kowalski",
  email: "jan.kowalski@st.amu.edu.pl",
  studentNumber: "123456",
  role: "student",
};

beforeEach(() => {
  replace.mockReset();
  fetchMock.mockReset();
  global.fetch = fetchMock as unknown as typeof fetch;
});

describe("ProfileDetails", () => {
  it("pokazuje loading podczas pobierania danych", () => {
    fetchMock.mockReturnValue(new Promise(() => {}));

    render(<ProfileDetails />);

    expect(
      screen.getByText("Ładowanie profilu…")
    ).toBeInTheDocument();
  });

  it("wyświetla dane zalogowanego użytkownika", async () => {
    fetchMock.mockResolvedValue(response(user));

    render(<ProfileDetails />);

    expect(await screen.findByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Kowalski")).toBeInTheDocument();
    expect(screen.getByText("123456")).toBeInTheDocument();
    expect(
      screen.getByText("jan.kowalski@st.amu.edu.pl")
    ).toBeInTheDocument();
    expect(screen.getByText("student")).toBeInTheDocument();
  });

  it("przekierowuje niezalogowanego użytkownika", async () => {
    fetchMock.mockResolvedValue(response(null, false, 401));

    render(<ProfileDetails />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith("/login");
    });
  });

it("pokazuje błąd i pozwala spróbować ponownie", async () => {
  // Na początku KAŻDY request kończy się błędem
  fetchMock.mockResolvedValue(response(null, false, 500));

  render(<ProfileDetails />);

  const retry = await screen.findByRole("button", {
    name: "Spróbuj ponownie",
  });

  // Od tego momentu backend już "działa"
  fetchMock.mockResolvedValue(response(user));

  fireEvent.click(retry);

  expect(await screen.findByText("Jan")).toBeInTheDocument();
});
});