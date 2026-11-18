import type { Metadata } from "next";
import { Suspense } from "react";
import LoginError from "../../components/LoginError";

export const metadata: Metadata = {
  title: "Logowanie · PRI 2.0",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10 md:px-11">
      <div className="flex w-full max-w-[1048px] flex-col items-center justify-center gap-6 rounded-[20px] border border-border bg-surface p-6 text-center sm:min-h-[422px] sm:p-[57px]">
        <span className="font-logo text-[56px] leading-[72px]">PRI 2.0</span>

        <h1 className="font-inter text-[22px] font-semibold leading-[27px]">
          System obsługi Projektu Inżynierskiego
        </h1>

        <a
          href="/api/auth/usos/login"
          className="flex w-full max-w-[446px] items-center justify-center rounded-[2px] bg-primary px-6 py-[13px] text-[15px] font-semibold leading-5 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Zaloguj przez USOS
        </a>

        <Suspense fallback={null}>
          <LoginError />
        </Suspense>

        <p className="font-inter text-sm leading-[17px] text-muted">
          Dane o roli i grupach zajęciowych zostaną pobrane z USOS
        </p>
      </div>
    </div>
  );
}
