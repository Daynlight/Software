import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

const user = { id: '123', firstName: 'Jan', lastName: 'Kowalski' };
const handshake = { token: 'request-token', secret: 'request-secret' };

function createService() {
  const usos = {
    requestToken: jest.fn().mockResolvedValue(handshake),
    exchangeToken: jest.fn().mockResolvedValue({
      token: 'access-token',
      secret: 'access-secret',
    }),
    fetchUser: jest.fn().mockResolvedValue(user),
  };
  const handshakeCookies = {
    seal: jest.fn().mockReturnValue('sealed-handshake'),
    open: jest.fn().mockReturnValue(handshake),
  };
  const sessions = { issue: jest.fn().mockResolvedValue('session-token') };
  const config = {
    get: jest.fn().mockReturnValue('https://usosapps.amu.edu.pl'),
  } as unknown as ConfigService;

  return {
    service: new AuthService(
      usos as never,
      handshakeCookies as never,
      sessions as never,
      config,
    ),
    usos,
    handshakeCookies,
    sessions,
  };
}

describe('AuthService', () => {
  describe('begin', () => {
    it('returns the authorization URL and a sealed handshake', async () => {
      const { service, usos, handshakeCookies } = createService();

      await expect(service.begin()).resolves.toEqual({
        authorizationUrl:
          'https://usosapps.amu.edu.pl/services/oauth/authorize?oauth_token=request-token',
        handshake: 'sealed-handshake',
      });

      expect(usos.requestToken).toHaveBeenCalledTimes(1);
      expect(handshakeCookies.seal).toHaveBeenCalledWith(handshake);
    });

    it('encodes the request token in the authorization URL', async () => {
      const { service, usos } = createService();
      usos.requestToken.mockResolvedValue({
        token: 'a b&c',
        secret: 'request-secret',
      });

      const result = await service.begin();

      expect(result.authorizationUrl).toContain('oauth_token=a%20b%26c');
    });
  });

  describe('complete', () => {
    it('exchanges the verifier and issues a session', async () => {
      const { service, usos, handshakeCookies, sessions } = createService();

      await expect(
        service.complete('sealed-handshake', 'verifier'),
      ).resolves.toEqual({
        user,
        sessionToken: 'session-token',
      });

      expect(handshakeCookies.open).toHaveBeenCalledWith('sealed-handshake');
      expect(usos.exchangeToken).toHaveBeenCalledWith(handshake, 'verifier');
      expect(usos.fetchUser).toHaveBeenCalledWith({
        token: 'access-token',
        secret: 'access-secret',
      });
      expect(sessions.issue).toHaveBeenCalledWith(user);
    });

    it('rejects a missing verifier', async () => {
      const { service, handshakeCookies } = createService();

      await expect(
        service.complete('sealed-handshake', undefined),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(handshakeCookies.open).not.toHaveBeenCalled();
    });

    it('rejects an empty verifier', async () => {
      const { service } = createService();

      await expect(
        service.complete('sealed-handshake', ''),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an invalid handshake', async () => {
      const { service, handshakeCookies, usos } = createService();
      handshakeCookies.open.mockReturnValue(null);

      await expect(
        service.complete('invalid', 'verifier'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      expect(usos.exchangeToken).not.toHaveBeenCalled();
    });

    it('propagates a rejected token exchange', async () => {
      const { service, usos } = createService();
      usos.exchangeToken.mockRejectedValue(new UnauthorizedException());

      await expect(
        service.complete('sealed-handshake', 'verifier'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
