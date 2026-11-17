import { BadGatewayException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsosOAuthClient } from './usos-oauth.client';

const configuration: Record<string, string> = {
  'usos.baseUrl': 'https://usosapps.amu.edu.pl',
  'usos.consumerKey': 'consumer-key',
  'usos.consumerSecret': 'consumer-secret',
  'usos.callbackUrl': 'http://localhost:8090/api/auth/usos/callback',
  'usos.scopes': 'email|studies',
};

function createClient(overrides: Record<string, string> = {}) {
  const config = {
    get: jest.fn((key: string) => ({ ...configuration, ...overrides })[key]),
  } as unknown as ConfigService;

  return { client: new UsosOAuthClient(config), config };
}

function mockFetch(status: number, body: string) {
  return jest.fn().mockResolvedValue({
    status,
    text: () => Promise.resolve(body),
  });
}

function authorizationHeader(fetchMock: jest.Mock): string {
  return fetchMock.mock.calls[0][1].headers.Authorization;
}

function requestBody(fetchMock: jest.Mock): URLSearchParams {
  return new URLSearchParams(fetchMock.mock.calls[0][1].body);
}

describe('UsosOAuthClient', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('requestToken', () => {
    it('requests a token with the callback URL and scopes', async () => {
      const fetchMock = mockFetch(
        200,
        'oauth_token=request-token&oauth_token_secret=request-secret&oauth_callback_confirmed=true',
      );
      global.fetch = fetchMock;
      const { client } = createClient();

      await expect(client.requestToken()).resolves.toEqual({
        token: 'request-token',
        secret: 'request-secret',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://usosapps.amu.edu.pl/services/oauth/request_token',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(requestBody(fetchMock).get('oauth_callback')).toBe(
        configuration['usos.callbackUrl'],
      );
      expect(requestBody(fetchMock).get('scopes')).toBe('email|studies');
      expect(authorizationHeader(fetchMock)).toContain(
        'oauth_consumer_key="consumer-key"',
      );
      expect(authorizationHeader(fetchMock)).toContain('oauth_signature=');
    });

    it('omits empty scopes', async () => {
      const fetchMock = mockFetch(
        200,
        'oauth_token=request-token&oauth_token_secret=request-secret',
      );
      global.fetch = fetchMock;
      const { client } = createClient({ 'usos.scopes': '' });

      await client.requestToken();

      expect(requestBody(fetchMock).has('scopes')).toBe(false);
    });

    it('rejects a response without tokens', async () => {
      global.fetch = mockFetch(200, 'oauth_callback_confirmed=true');
      const { client } = createClient();

      await expect(client.requestToken()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('rejects a failed request', async () => {
      global.fetch = mockFetch(500, 'Internal Server Error');
      const { client } = createClient();

      await expect(client.requestToken()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('rejects when the USOS API is unreachable', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('network'));
      const { client } = createClient();

      await expect(client.requestToken()).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });

  describe('exchangeToken', () => {
    const handshake = { token: 'request-token', secret: 'request-secret' };
    const tokenBody =
      'oauth_token=access-token&oauth_token_secret=access-secret';

    it('exchanges an authorized request token for an access token', async () => {
      const fetchMock = mockFetch(200, tokenBody);
      global.fetch = fetchMock;
      const { client } = createClient();

      await expect(
        client.exchangeToken(handshake, 'verifier'),
      ).resolves.toEqual({ token: 'access-token', secret: 'access-secret' });

      expect(requestBody(fetchMock).get('oauth_verifier')).toBe('verifier');
      expect(authorizationHeader(fetchMock)).toContain(
        'oauth_token="request-token"',
      );
    });

    it('rejects an invalid verifier', async () => {
      global.fetch = mockFetch(400, 'Invalid verifier');
      const { client } = createClient();

      await expect(
        client.exchangeToken(handshake, 'invalid'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an unauthorized request token', async () => {
      global.fetch = mockFetch(401, 'Unauthorized');
      const { client } = createClient();

      await expect(
        client.exchangeToken(handshake, 'verifier'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a server failure', async () => {
      global.fetch = mockFetch(503, 'Service Unavailable');
      const { client } = createClient();

      await expect(
        client.exchangeToken(handshake, 'verifier'),
      ).rejects.toBeInstanceOf(BadGatewayException);
    });
  });

  describe('fetchUser', () => {
    const token = { token: 'access-token', secret: 'access-secret' };

    it('maps the USOS profile to a session user', async () => {
      const fetchMock = mockFetch(
        200,
        JSON.stringify({
          id: '123',
          first_name: 'Jan',
          last_name: 'Kowalski',
          student_number: '123456',
          has_photo: true,
          photo_urls: { '200x200': 'https://example.com/photo.jpg' },
        }),
      );
      global.fetch = fetchMock;
      const { client } = createClient();

      await expect(client.fetchUser(token)).resolves.toEqual({
        id: '123',
        firstName: 'Jan',
        lastName: 'Kowalski',
        studentNumber: '123456',
        photoUrl: 'https://example.com/photo.jpg',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        'https://usosapps.amu.edu.pl/services/users/user?fields=id%7Cfirst_name%7Clast_name%7Cstudent_number%7Chas_photo%7Cphoto_urls%5B200x200%5D',
        expect.objectContaining({ method: 'GET' }),
      );
      expect(authorizationHeader(fetchMock)).toContain(
        'oauth_token="access-token"',
      );
    });

    it('omits a photo the user is not allowed to show', async () => {
      global.fetch = mockFetch(
        200,
        JSON.stringify({
          id: '123',
          first_name: 'Jan',
          last_name: 'Kowalski',
          student_number: '123456',
          has_photo: false,
          photo_urls: { '200x200': 'https://example.com/photo.jpg' },
        }),
      );
      const { client } = createClient();

      await expect(client.fetchUser(token)).resolves.toEqual({
        id: '123',
        firstName: 'Jan',
        lastName: 'Kowalski',
        studentNumber: '123456',
        photoUrl: null,
      });
    });

    it('handles a profile without optional data', async () => {
      global.fetch = mockFetch(
        200,
        JSON.stringify({
          id: '123',
          first_name: 'Jan',
          last_name: 'Kowalski',
          student_number: null,
        }),
      );
      const { client } = createClient();

      await expect(client.fetchUser(token)).resolves.toEqual({
        id: '123',
        firstName: 'Jan',
        lastName: 'Kowalski',
        studentNumber: null,
        photoUrl: null,
      });
    });

    it('rejects a profile with missing fields', async () => {
      global.fetch = mockFetch(200, JSON.stringify({ id: '123' }));
      const { client } = createClient();

      await expect(client.fetchUser(token)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('rejects an invalid JSON body', async () => {
      global.fetch = mockFetch(200, 'not-json');
      const { client } = createClient();

      await expect(client.fetchUser(token)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });

    it('rejects a failed request', async () => {
      global.fetch = mockFetch(500, 'Internal Server Error');
      const { client } = createClient();

      await expect(client.fetchUser(token)).rejects.toBeInstanceOf(
        BadGatewayException,
      );
    });
  });
});
