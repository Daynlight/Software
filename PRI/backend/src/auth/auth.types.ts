export interface UsosToken {
  token: string;
  secret: string;
}

export type UsosHandshake = UsosToken;

export type UserRole = 'student' | 'pracownik' | 'użytkownik';

export interface UsosSessionUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  studentNumber: string | null;
  role: UserRole;
}

export interface UsosProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  student_number: string | null;
  student_status: number | null;
  staff_status: number;
}