export interface UsosToken {
  token: string;
  secret: string;
}

export type UsosHandshake = UsosToken;

export interface UsosSessionUser {
  id: string;
  usos_id: number;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  email: string | null;
  photoUrl: string | null;
}

export interface UsosProfile {
  id: string;
  usos_id: number;
  first_name: string;
  last_name: string;
  student_number?: string | null;
  email: string | null;
  has_photo?: boolean;
  photo_urls?: Record<string, string>;
}
