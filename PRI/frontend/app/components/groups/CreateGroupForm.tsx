"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { createGroup } from "../../lib/groups-client";

type FieldErrors = {
  name?: string;
  description?: string;
};

const field =
  "w-full rounded-[2px] border border-field bg-white px-4 py-3 text-base leading-6 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const label = "mb-1 block text-sm font-medium leading-6";

function validate(name: string, description: string): FieldErrors {
  const errors: FieldErrors = {};

  if (name.trim().length < 3) {
    errors.name = "Nazwa musi mieć co najmniej 3 znaki.";
  } else if (name.trim().length > 100) {
    errors.name = "Nazwa może mieć najwyżej 100 znaków.";
  }

  if (description.trim().length < 10) {
    errors.description = "Opis musi mieć co najmniej 10 znaków.";
  } else if (description.trim().length > 2000) {
    errors.description = "Opis może mieć najwyżej 2000 znaków.";
  }

  return errors;
}

export default function CreateGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const nextErrors = validate(name, description);
    setErrors(nextErrors);
    setServerError(null);

    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.name) {
        nameRef.current?.focus();
      } else {
        descriptionRef.current?.focus();
      }
      return;
    }

    setSubmitting(true);

    try {
      await createGroup({
        name: name.trim(),
        description: description.trim(),
      });
      router.push("/moja-grupa");
    } catch (cause) {
      setServerError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się utworzyć grupy. Spróbuj ponownie.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      className="flex flex-col gap-7"
    >
      <div>
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <label htmlFor="group-name" className={label}>
            Nazwa grupy
          </label>
          <span className="text-xs text-muted">{name.length}/100</span>
        </div>
        <input
          ref={nameRef}
          id="group-name"
          name="name"
          type="text"
          autoComplete="off"
          value={name}
          maxLength={100}
          required
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "group-name-error" : "group-name-hint"}
          onChange={(event) => {
            setName(event.target.value);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          className={field}
          placeholder="np. Zespół ds. planera zajęć…"
        />
        <p id="group-name-hint" className="mt-1 text-xs leading-5 text-muted">
          Krótka nazwa widoczna na giełdzie grup.
        </p>
        {errors.name && (
          <p id="group-name-error" role="alert" className="mt-1 text-sm text-danger">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <label htmlFor="group-description" className={label}>
            Opis projektu
          </label>
          <span className="text-xs text-muted">{description.length}/2000</span>
        </div>
        <textarea
          ref={descriptionRef}
          id="group-description"
          name="description"
          value={description}
          rows={7}
          maxLength={2000}
          required
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description
              ? "group-description-error"
              : "group-description-hint"
          }
          onChange={(event) => {
            setDescription(event.target.value);
            setErrors((current) => ({ ...current, description: undefined }));
          }}
          className={field}
          placeholder="Czym chcecie się zająć, jaki problem rozwiązujecie i czego szukacie u członków zespołu?…"
        />
        <p
          id="group-description-hint"
          className="mt-1 text-xs leading-5 text-muted"
        >
          Opisz cel projektu i zakres. Pomaga to osobom, które szukają zespołu.
        </p>
        {errors.description && (
          <p
            id="group-description-error"
            role="alert"
            className="mt-1 text-sm text-danger"
          >
            {errors.description}
          </p>
        )}
      </div>

      {serverError && (
        <p
          role="alert"
          className="border-l-2 border-danger pl-3 text-sm leading-6 text-danger"
        >
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
        <Link
          href="/gielda"
          className="text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Wróć do giełdy
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 rounded-[2px] bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Tworzenie…" : "Utwórz grupę"}
        </button>
      </div>
    </form>
  );
}
