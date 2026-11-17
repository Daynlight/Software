import {
  BadGatewayException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthController } from './auth.controller';
import {
  HANDSHAKE_COOKIE,
  HANDSHAKE_TTL_SECONDS,
  SESSION_COOKIE,
} from './auth.constants';

const user = { id: '123', firstName: 'Jan', lastName: 'Kowalski' };

function createController(options: { cookiesSecure?: boolean } = {}) {
  const auth = {
    begin: jest.fn().mockResolvedValue({
      authorizationUrl:
        'https://usosapps.amu.edu.pl/services/oauth/authorize?oauth_token=token',
      handshake: 'sealed-handshake',
    }),
    complete: jest.fn().mockResolvedValue({
      user,
      sessionToken: 'session-token',
    }),
  };
  const values: Record<string, unknown> = {
    frontendUrl: 'http://localhost:8090',
    cookiesSecure: options.cookiesSecure ?? false,
    sessionTtlSeconds: 86400,
  };
  const config = {
    get: jest.fn((key: string) => values[key]),
  } as unknown as ConfigService;
  const response = {
    cookie: jest.fn(),
    redirect: jest.fn(),
    clearCookie: jest.fn(),
  };

  return {
    controller: new AuthController(auth as never, config),
    auth,
    response: response as unknown as Response,
    responseMock: response,
  };
}

describe('AuthController', () => {
  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    it('redirects to USOS and stores the handshake cookie', async () => {
      const { controller, response, responseMock } = createController();

      await controller.login(response);

      expect(responseMock.cookie).toHaveBeenCalledWith(
        HANDSHAKE_COOKIE,
        'sealed-handshake',
        {
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/',
          maxAge: HANDSHAKE_TTL_SECONDS * 1000,
        },
      );
      expect(responseMock.redirect).toHaveBeenCalledWith(
        'https://usosapps.amu.edu.pl/services/oauth/authorize?oauth_token=token',
      );
    });

    it('redirects to the login page when USOS is unavailable', async () => {
      const { controller, auth, response, responseMock } = createController();
      auth.begin.mockRejectedValue(new BadGatewayException());

      await controller.login(response);

      expect(responseMock.cookie).not.toHaveBeenCalled();
      expect(responseMock.redirect).toHaveBeenCalledWith(
        'http://localhost:8090/login?error=usos_unavailable',
      );
    });
  });

  describe('callback', () => {
    it('stores the session cookie and redirects to the frontend', async () => {
      const { controller, auth, response, responseMock } = createController();

      await controller.callback(
        'verifier',
        {
          cookies: { [HANDSHAKE_COOKIE]: 'sealed-handshake' },
        } as never,
        response,
      );

      expect(auth.complete).toHaveBeenCalledWith(
        'sealed-handshake',
        'verifier',
      );
      expect(responseMock.cookie).toHaveBeenCalledWith(
        SESSION_COOKIE,
        'session-token',
        {
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/',
          maxAge: 86400 * 1000,
        },
      );
      expect(responseMock.clearCookie).toHaveBeenCalledWith(HANDSHAKE_COOKIE, {
        path: '/',
      });
      expect(responseMock.redirect).toHaveBeenCalledWith(
        'http://localhost:8090/dashboard',
      );
    });

    it('handles a request without parsed cookies', async () => {
      const { controller, auth, response } = createController();

      await controller.callback('verifier', {} as never, response);

      expect(auth.complete).toHaveBeenCalledWith(undefined, 'verifier');
    });

    it('redirects to the login page when the exchange fails', async () => {
      const { controller, auth, response, responseMock } = createController();
      auth.complete.mockRejectedValue(new UnauthorizedException());

      await controller.callback(
        'verifier',
        {
          cookies: { [HANDSHAKE_COOKIE]: 'sealed-handshake' },
        } as never,
        response,
      );

      expect(responseMock.cookie).not.toHaveBeenCalled();
      expect(responseMock.clearCookie).toHaveBeenCalledWith(HANDSHAKE_COOKIE, {
        path: '/',
      });
      expect(responseMock.redirect).toHaveBeenCalledWith(
        'http://localhost:8090/login?error=usos_auth_failed',
      );
    });

    it('marks cookies as secure in production', async () => {
      const { controller, response, responseMock } = createController({
        cookiesSecure: true,
      });

      await controller.callback(
        'verifier',
        {
          cookies: { [HANDSHAKE_COOKIE]: 'sealed-handshake' },
        } as never,
        response,
      );

      expect(responseMock.cookie).toHaveBeenCalledWith(
        SESSION_COOKIE,
        'session-token',
        expect.objectContaining({ secure: true }),
      );
    });
  });

  describe('me', () => {
    it('returns the authenticated user', () => {
      const { controller } = createController();

      expect(controller.me({ user } as never)).toEqual(user);
    });
  });

  describe('logout', () => {
    it('clears the session cookie', () => {
      const { controller, response, responseMock } = createController();

      controller.logout(response);

      expect(responseMock.clearCookie).toHaveBeenCalledWith(SESSION_COOKIE, {
        path: '/',
      });
    });
  });
});
