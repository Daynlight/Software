import { ConfigService } from '@nestjs/config';
import { HandshakeCookieService } from './handshake-cookie.service';

const sessionSecret = 'a'.repeat(64);

function createService(secret = sessionSecret): HandshakeCookieService {
  const config = {
    get: jest.fn().mockReturnValue(secret),
  } as unknown as ConfigService;

  return new HandshakeCookieService(config);
}

describe('HandshakeCookieService', () => {
  const handshake = { token: 'request-token', secret: 'request-token-secret' };

  afterEach(() => {
    jest.useRealTimers();
  });

  it('seals and opens a handshake', () => {
    const service = createService();

    expect(service.open(service.seal(handshake))).toEqual(handshake);
  });

  it('produces a different value for every seal', () => {
    const service = createService();

    expect(service.seal(handshake)).not.toBe(service.seal(handshake));
  });

  it('rejects a handshake sealed with another secret', () => {
    const sealed = createService().seal(handshake);

    expect(createService('b'.repeat(64)).open(sealed)).toBeNull();
  });

  it('rejects a tampered handshake', () => {
    const service = createService();
    const sealed = service.seal(handshake);
    const tampered = `${sealed.slice(0, -2)}AA`;

    expect(service.open(tampered)).toBeNull();
  });

  it('rejects a malformed handshake', () => {
    expect(createService().open('not-a-valid-cookie')).toBeNull();
  });

  it('rejects a missing handshake', () => {
    expect(createService().open(undefined)).toBeNull();
  });

  it('rejects an expired handshake', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const service = createService();
    const sealed = service.seal(handshake);

    jest.setSystemTime(new Date('2025-01-01T00:10:01Z'));

    expect(service.open(sealed)).toBeNull();
  });

  it('accepts a handshake within its lifetime', () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00Z'));
    const service = createService();
    const sealed = service.seal(handshake);

    jest.setSystemTime(new Date('2025-01-01T00:09:59Z'));

    expect(service.open(sealed)).toEqual(handshake);
  });
});
