"use client";

import { useSearchParams } from "next/navigation";

const messages: Record<string, string> = {
  usos_unavailable:
    "Serwis USOS jest chwilowo niedostępny. Spróbuj ponownie za kilka minut.",
  usos_auth_failed:
    "Logowanie przez USOS nie powiodło się. Spróbuj ponownie.",
};

export default function LoginError() {
  const error = useSearchParams().get("error");

  if (!error) {
    return null;
  }

  return (
    <p
      role="alert"
      className="w-full max-w-[446px] border border-border bg-background px-4 py-3 text-left font-inter text-sm leading-[17px] text-foreground"
    >
      {messages[error] ?? "Logowanie nie powiodło się. Spróbuj ponownie."}
    </p>
  );
}
