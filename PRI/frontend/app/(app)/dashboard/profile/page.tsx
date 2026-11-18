import type { Metadata } from "next";
import Card from "../../../components/Card";
import ProfileDetails from "../../../components/ProfileDetails";

export const metadata: Metadata = {
  title: "Profil · PRI 2.0",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[1116px]">
      <h1 className="sr-only">Profil użytkownika</h1>

      <Card id="moje-dane" title="Moje dane">
        <ProfileDetails />
      </Card>
    </div>
  );
}