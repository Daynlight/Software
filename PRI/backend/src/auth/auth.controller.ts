import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Request, Response } from 'express';
import { AuthService } from './auth.service';
import {
  HANDSHAKE_COOKIE,
  HANDSHAKE_TTL_SECONDS,
  SESSION_COOKIE,
} from './auth.constants';
import { AuthenticatedRequest, SessionGuard } from './session.guard';
import { UsosSessionUser } from './auth.types';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('usos/login')
  async login(@Res() response: Response): Promise<void> {
    try {
      const { authorizationUrl, handshake } = await this.auth.begin();

      response.cookie(
        HANDSHAKE_COOKIE,
        handshake,
        this.handshakeCookieOptions(),
      );
      response.redirect(authorizationUrl);
    } catch (error) {
      this.logger.warn(
        `Nie udało się rozpocząć logowania przez USOS: ${(error as Error).message}`,
      );
      response.redirect(
        `${this.config.get('frontendUrl')}/login?error=usos_unavailable`,
      );
    }
  }

  @Get('usos/callback')
  async callback(
    @Query('oauth_verifier') verifier: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const { sessionToken } = await this.auth.complete(
        request.cookies?.[HANDSHAKE_COOKIE],
        verifier,
      );

      response.cookie(
        SESSION_COOKIE,
        sessionToken,
        this.sessionCookieOptions(),
      );
      response.clearCookie(HANDSHAKE_COOKIE, { path: '/' });
      response.redirect(`${this.config.get('frontendUrl')}/dashboard`);
    } catch (error) {
      this.logger.warn(
        `Logowanie przez USOS nie powiodło się: ${(error as Error).message}`,
      );
      response.clearCookie(HANDSHAKE_COOKIE, { path: '/' });
      response.redirect(
        `${this.config.get('frontendUrl')}/login?error=usos_auth_failed`,
      );
    }
  }

  @UseGuards(SessionGuard)
  @Get('me')
  me(@Req() request: AuthenticatedRequest): UsosSessionUser {
    return request.user;
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE, { path: '/' });
  }

  private handshakeCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('cookiesSecure'),
      path: '/',
      maxAge: HANDSHAKE_TTL_SECONDS * 1000,
    };
  }

  private sessionCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('cookiesSecure'),
      path: '/',
      maxAge: this.config.get('sessionTtlSeconds') * 1000,
    };
  }
}
