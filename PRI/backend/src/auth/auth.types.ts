export interface UsosToken {
  token: string;
  secret: string;
}

export type UsosHandshake = UsosToken;

export interface UsosSessionUser {
  id: string;
  firstName: string;
  lastName: string;
}

export interface UsosProfile {
  id: string;
  first_name: string;
  last_name: string;
}
