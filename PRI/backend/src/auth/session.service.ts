import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UsosSessionUser } from './auth.types';

interface SessionPayload {
  sub: string;
  firstName: string;
  lastName: string;
  email: string | null;
  studentNumber: string | null;
  role: UsosSessionUser['role'];
}

@Injectable()
export class SessionService {
  private readonly ttlSeconds: number;

  constructor(
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.ttlSeconds = config.get('sessionTtlSeconds');
  }

  issue(user: UsosSessionUser): Promise<string> {
    return this.jwt.signAsync(
      {
        sub: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        studentNumber: user.studentNumber,
        role: user.role,
      },
      { expiresIn: this.ttlSeconds },
    );
  }

  async verify(token: string): Promise<UsosSessionUser | null> {
    try {
      const payload = await this.jwt.verifyAsync<SessionPayload>(token);

      return payload.sub
        ? {
            id: payload.sub,
            firstName: payload.firstName,
            lastName: payload.lastName,
            email: payload.email,
            studentNumber: payload.studentNumber,
            role: payload.role,
          }
        : null;
    } catch {
      return null;
    }
  }
}
