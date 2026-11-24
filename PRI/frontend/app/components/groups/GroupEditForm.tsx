"use client";

import { useRef, useState } from "react";
import { GroupSummary, updateGroup } from "../../lib/groups-client";
import {
  GroupFieldErrors,
  validateGroupFields,
} from "../../lib/group-validation";

const field =
  "w-full rounded-[2px] border border-field bg-white px-4 py-3 text-base leading-6 text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
const label = "mb-1 block text-sm font-medium leading-6";

export default function GroupEditForm({
  group,
  onCancel,
  onUpdated,
}: {
  group: GroupSummary;
  onCancel: () => void;
  onUpdated: (group: GroupSummary) => void;
}) {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [errors, setErrors] = useState<GroupFieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ): Promise<void> {
    event.preventDefault();
    const nextErrors = validateGroupFields(name, description);
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
      onUpdated(
        await updateGroup(group.id, {
          name: name.trim(),
          description: description.trim(),
        }),
      );
      setSubmitting(false);
    } catch (cause) {
      setServerError(
        cause instanceof Error
          ? cause.message
          : "Nie udało się zapisać zmian. Spróbuj ponownie.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      noValidate
      className="flex flex-col gap-5 border-y border-foreground py-5"
      aria-label="Edycja grupy"
    >
      <div>
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <label htmlFor="edit-group-name" className={label}>
            Nazwa grupy
          </label>
          <span className="text-xs text-muted">{name.length}/100</span>
        </div>
        <input
          ref={nameRef}
          id="edit-group-name"
          name="name"
          type="text"
          value={name}
          maxLength={100}
          autoComplete="off"
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "edit-group-name-error" : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setServerError(null);
            setErrors((current) => ({ ...current, name: undefined }));
          }}
          className={field}
        />
        {errors.name && (
          <p id="edit-group-name-error" role="alert" className="mt-1 text-sm text-danger">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between gap-4">
          <label htmlFor="edit-group-description" className={label}>
            Opis projektu
          </label>
          <span className="text-xs text-muted">
            {description.length}/2000
          </span>
        </div>
        <textarea
          ref={descriptionRef}
          id="edit-group-description"
          name="description"
          value={description}
          rows={5}
          maxLength={2000}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? "edit-group-description-error" : undefined
          }
          onChange={(event) => {
            setDescription(event.target.value);
            setServerError(null);
            setErrors((current) => ({ ...current, description: undefined }));
          }}
          className={field}
        />
        {errors.description && (
          <p
            id="edit-group-description-error"
            role="alert"
            className="mt-1 text-sm text-danger"
          >
            {errors.description}
          </p>
        )}
      </div>

      {serverError && (
        <p role="alert" className="border-l-2 border-danger pl-3 text-sm text-danger">
          {serverError}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 text-sm font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-10 rounded-[2px] bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </div>
    </form>
  );
}
