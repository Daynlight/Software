import { render, screen } from "@testing-library/react";
import { useSessionUser } from "../../../lib/use-session-user";
import NewGroupPage from "./page";

jest.mock("../../../lib/use-session-user", () => ({
  useSessionUser: jest.fn(),
}));

jest.mock("../../../components/groups/CreateGroupForm", () => ({
  __esModule: true,
  default: () => <div>formularz grupy</div>,
}));

const useSessionUserMock = useSessionUser as jest.MockedFunction<
  typeof useSessionUser
>;

const student = {
  id: "user-1",
  firstName: "Jan",
  lastName: "Kowalski",
  studentNumber: "S1",
  email: "jan@example.com",
  photoUrl: null,
  role: "STUDENT" as const,
};

describe("NewGroupPage", () => {
  beforeEach(() => {
    useSessionUserMock.mockReset();
  });

  it("shows the session loading state", () => {
    useSessionUserMock.mockReturnValue(null);

    render(<NewGroupPage />);

    expect(screen.getByText("Sprawdzanie sesji…")).toBeInTheDocument();
  });

  it("blocks users without the student role", () => {
    useSessionUserMock.mockReturnValue({ ...student, role: "OTHER" });

    render(<NewGroupPage />);

    expect(screen.getByText(/Grupy mogą zakładać tylko studenci/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Wróć do giełdy" })).toHaveAttribute(
      "href",
      "/gielda",
    );
    expect(screen.queryByText("formularz grupy")).not.toBeInTheDocument();
  });

  it("renders the form and guidance for students", () => {
    useSessionUserMock.mockReturnValue(student);

    render(<NewGroupPage />);

    expect(
      screen.getByRole("heading", { name: /Zacznij od pomysłu/ }),
    ).toBeInTheDocument();
    expect(screen.getByText("formularz grupy")).toBeInTheDocument();
    expect(screen.getByText("3–100 znaków, widoczna na giełdzie")).toBeInTheDocument();
  });
});
