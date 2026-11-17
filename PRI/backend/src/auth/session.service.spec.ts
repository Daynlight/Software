import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';

const secret = 'a'.repeat(64);
const user = { id: '123', firstName: 'Jan', lastName: 'Kowalski' };

function createService(ttlSeconds = 3600) {
  const config = {
    get: jest.fn().mockReturnValue(ttlSeconds),
  } as unknown as ConfigService;
  const jwt = new JwtService({ secret });

  return { service: new SessionService(jwt, config), jwt };
}

describe('SessionService', () => {
  it('issues a token that verifies back to the user', async () => {
    const { service } = createService();

    const token = await service.issue(user);

    await expect(service.verify(token)).resolves.toEqual(user);
  });

  it('issues a token with the configured lifetime', async () => {
    const { service, jwt } = createService(7200);

    const token = await service.issue(user);
    const payload = jwt.decode(token) as { iat: number; exp: number };

    expect(payload.exp - payload.iat).toBe(7200);
  });

  it('rejects a token signed with another secret', async () => {
    const { service } = createService();
    const foreignToken = new JwtService({ secret: 'b'.repeat(64) }).sign({
      sub: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await expect(service.verify(foreignToken)).resolves.toBeNull();
  });

  it('rejects a malformed token', async () => {
    const { service } = createService();

    await expect(service.verify('not-a-token')).resolves.toBeNull();
  });

  it('rejects an expired token', async () => {
    const { service, jwt } = createService();
    const expiredToken = jwt.sign(
      { sub: user.id, firstName: user.firstName, lastName: user.lastName },
      { expiresIn: -1 },
    );

    await expect(service.verify(expiredToken)).resolves.toBeNull();
  });

  it('rejects a token without a subject', async () => {
    const { service, jwt } = createService();
    const token = jwt.sign({ firstName: user.firstName });

    await expect(service.verify(token)).resolves.toBeNull();
  });
});
