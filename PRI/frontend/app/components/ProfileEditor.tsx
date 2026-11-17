"use client";

import ProfileForm from "./ProfileForm";
import { useSessionUser } from "../lib/use-session-user";

export default function ProfileEditor() {
  const user = useSessionUser();

  if (!user) {
    return <p className="text-muted">Sprawdzanie sesji…</p>;
  }

  return (
    <ProfileForm
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        indexNumber: user.id,
        about: "",
        skills: "",
      }}
    />
  );
}
