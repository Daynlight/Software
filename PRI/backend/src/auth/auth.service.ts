import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HandshakeCookieService } from './handshake-cookie.service';
import { SessionService } from './session.service';
import { UsosOAuthClient } from './usos-oauth.client';
import { UsosSessionUser } from './auth.types';
import { UsersService } from '../database/users/users.service';

export interface LoginStart {
  authorizationUrl: string;
  handshake: string;
}

export interface LoginResult {
  user: UsosSessionUser;
  sessionToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usos: UsosOAuthClient,
    private readonly handshakeCookies: HandshakeCookieService,
    private readonly sessions: SessionService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  async begin(): Promise<LoginStart> {
    const requestToken = await this.usos.requestToken();
    const baseUrl = this.config.get('usos.baseUrl');

    return {
      authorizationUrl: `${baseUrl}/services/oauth/authorize?oauth_token=${encodeURIComponent(requestToken.token)}`,
      handshake: this.handshakeCookies.seal(requestToken),
    };
  }

  async complete(
    handshake: string | undefined,
    verifier: string | undefined,
  ): Promise<LoginResult> {
    if (!verifier) {
      throw new UnauthorizedException('Brak kodu autoryzacji USOS');
    }

    const tokens = this.handshakeCookies.open(handshake);

    if (!tokens) {
      throw new UnauthorizedException('Sesja logowania przez USOS wygasła');
    }

    const accessToken = await this.usos.exchangeToken(tokens, verifier);
    const usosProfile = await this.usos.fetchUser(accessToken);

    const usosId = Number(usosProfile.id);
    if (!Number.isInteger(usosId) || usosId <= 0) {
      throw new UnauthorizedException(
        'Niepoprawny identyfikator użytkownika USOS',
      );
    }

    const dbUser = await this.users.upsertFromUsos({
      usosId,
      firstName: usosProfile.firstName,
      lastName: usosProfile.lastName,
      studentNumber: usosProfile.studentNumber,
      email: usosProfile.email,
      role: usosProfile.role,
    });

    const sessionUser: UsosSessionUser = {
      id: dbUser.id,
      usos_id: dbUser.usos_id,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      studentNumber: dbUser.student_number,
      email: dbUser.email,
      photoUrl: usosProfile.photoUrl,
      role: dbUser.role,
    };

    const sessionToken = await this.sessions.issue(sessionUser);

    return { user: sessionUser, sessionToken };
  }
}
