import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HandshakeCookieService } from './handshake-cookie.service';
import { SessionService } from './session.service';
import { UsosOAuthClient } from './usos-oauth.client';
import { UsosSessionUser } from './auth.types';

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
    const user = await this.usos.fetchUser(accessToken);
    const sessionToken = await this.sessions.issue(user);

    return { user, sessionToken };
  }
}
