"use client";

import { useState } from "react";

export default function UserPhoto({
  url,
  className,
}: {
  url: string | null;
  className: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!url || failed) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-placeholder text-[15px]`}
      >
        Zdjęcie
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="Zdjęcie profilowe"
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
