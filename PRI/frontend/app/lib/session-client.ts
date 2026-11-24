export interface UsosUser {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  email: string | null;
  photoUrl: string | null;
  role?: "STUDENT" | "OTHER";
}

export async function fetchCurrentUser(): Promise<UsosUser | null> {
  try {
    const response = await fetch("/api/auth/me");

    return response.ok ? ((await response.json()) as UsosUser) : null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    return;
  }
}
