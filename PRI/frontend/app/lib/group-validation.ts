export interface GroupFieldErrors {
  name?: string;
  description?: string;
}

export function validateGroupFields(
  name: string,
  description: string,
): GroupFieldErrors {
  const errors: GroupFieldErrors = {};

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
