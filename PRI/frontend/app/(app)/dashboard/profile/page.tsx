import type { Metadata } from "next";
import Card from "../../../components/Card";
import ProfileEditor from "../../../components/ProfileEditor";

export const metadata: Metadata = {
  title: "Edycja profilu · PRI 2.0",
};

export default function EditProfilePage() {
  return (
    <div className="mx-auto w-full max-w-[1116px]">
      <h1 className="sr-only">Edycja profilu</h1>

      <Card id="moje-dane" title="Moje dane">
        <ProfileEditor />
      </Card>
    </div>
  );
}