import { randomBytes } from 'node:crypto';
import {
  BadGatewayException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOAuthAuthorizationHeader } from './oauth-signature';
import {
  UsosHandshake,
  UsosProfile,
  UsosSessionUser,
  UsosToken,
} from './auth.types';

const HTTP_TIMEOUT_MS = 10_000;
const USER_FIELDS =
  'id|first_name|last_name|email|student_number|student_status|staff_status';

interface UsosResponse {
  status: number;
  body: string;
}

@Injectable()
export class UsosOAuthClient {
  constructor(private readonly config: ConfigService) {}

  async requestToken(): Promise<UsosToken> {
    const body: Record<string, string> = {
      oauth_callback: this.config.get('usos.callbackUrl'),
    };
    const scopes = this.config.get('usos.scopes');

    if (scopes) {
      body.scopes = scopes;
    }

    const response = await this.send('POST', '/services/oauth/request_token', {
      body,
    });

    if (response.status !== 200) {
      throw new BadGatewayException('USOS API odrzuciło żądanie tokenu');
    }

    return this.parseToken(response.body);
  }

  async exchangeToken(
    handshake: UsosHandshake,
    verifier: string,
  ): Promise<UsosToken> {
    const response = await this.send('POST', '/services/oauth/access_token', {
      token: handshake,
      body: { oauth_verifier: verifier },
    });

    if (response.status === 400 || response.status === 401) {
      throw new UnauthorizedException('Nieprawidłowy kod autoryzacji USOS');
    }

    if (response.status !== 200) {
      throw new BadGatewayException('USOS API odrzuciło wymianę tokenu');
    }

    return this.parseToken(response.body);
  }

  async fetchUser(token: UsosToken): Promise<UsosSessionUser> {
    const path = `/services/users/user?fields=${encodeURIComponent(USER_FIELDS)}`;
    const response = await this.send('GET', path, { token });

    if (response.status !== 200) {
      throw new BadGatewayException('Nie udało się pobrać profilu z USOS API');
    }

    return this.parseProfile(response.body);
  }

  private async send(
    method: 'GET' | 'POST',
    path: string,
    options: { token?: UsosToken; body?: Record<string, string> },
  ): Promise<UsosResponse> {
    const url = `${this.config.get('usos.baseUrl')}${path}`;
    const authorization = createOAuthAuthorizationHeader({
      method,
      url,
      consumerKey: this.config.get('usos.consumerKey'),
      consumerSecret: this.config.get('usos.consumerSecret'),
      token: options.token?.token,
      tokenSecret: options.token?.secret,
      nonce: randomBytes(16).toString('hex'),
      timestamp: Math.floor(Date.now() / 1000).toString(),
      extraParams: options.body,
    });

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Authorization: authorization,
          ...(options.body
            ? { 'Content-Type': 'application/x-www-form-urlencoded' }
            : {}),
        },
        body: options.body
          ? new URLSearchParams(options.body).toString()
          : undefined,
        signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
      });

      return { status: response.status, body: await response.text() };
    } catch {
      throw new BadGatewayException('USOS API jest niedostępne');
    }
  }

  private parseToken(body: string): UsosToken {
    const params = new URLSearchParams(body);
    const token = params.get('oauth_token');
    const secret = params.get('oauth_token_secret');

    if (!token || !secret) {
      throw new BadGatewayException('Nieprawidłowa odpowiedź USOS API');
    }

    return { token, secret };
  }

  private parseProfile(body: string): UsosSessionUser {
    try {
      const profile = JSON.parse(body) as UsosProfile;

      if (!profile.id || !profile.first_name || !profile.last_name) {
        throw new Error('Incomplete profile');
      }

      let role: UsosSessionUser['role'] = 'użytkownik';

      if (profile.staff_status > 0) {
        role = 'pracownik';
      } else if (profile.student_status === 2) {
        role = 'student';
      }

      return {
        id: String(profile.id),
        firstName: profile.first_name,
        lastName: profile.last_name,
        email: profile.email ?? null,
        studentNumber: profile.student_number ?? null,
        role,
      };
    } catch {
      throw new BadGatewayException('Nieprawidłowy profil USOS API');
    }
  }
}
