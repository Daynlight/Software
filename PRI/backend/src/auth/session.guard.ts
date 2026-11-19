import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { SESSION_COOKIE } from './auth.constants';
import { SessionService } from './session.service';
import { UsosSessionUser } from './auth.types';

export interface AuthenticatedRequest extends Request {
  user?: UsosSessionUser;
}

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = request.cookies?.[SESSION_COOKIE];
    const user = token ? await this.sessions.verify(token) : null;

    if (!user) {
      throw new UnauthorizedException('Brak aktywnej sesji');
    }

    request.user = user;

    return true;
  }
}
