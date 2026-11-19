"use client";

import { useEffect } from "react";

export default function Error({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div role="alert" className="rounded-xl border border-border bg-surface p-6">
      <h2 className="mb-2 text-xl font-semibold">Nie udało się załadować pulpitu</h2>
      <p className="mb-4 text-muted">
        Wystąpił problem z pobraniem danych. Spróbuj ponownie za chwilę.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-[2px] bg-primary px-6 py-[13px] text-[15px] font-semibold leading-5 text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}