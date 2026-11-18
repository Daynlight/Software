import { render, screen } from "@testing-library/react";
import ProfilePage from "./page";

jest.mock("../../../components/ProfileDetails", () => {
  return function MockProfileDetails() {
    return <div>Dane profilu</div>;
  };
});

describe("ProfilePage", () => {
  it("renders the profile page", () => {
    render(<ProfilePage />);

    expect(
      screen.getByRole("heading", {
        name: "Profil użytkownika",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Moje dane",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Dane profilu")).toBeInTheDocument();
  });
});