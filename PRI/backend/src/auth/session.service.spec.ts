import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { UsosSessionUser } from './auth.types';

const secret = 'a'.repeat(64);
const user: UsosSessionUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  usos_id: 123456,
  firstName: 'Jan',
  lastName: 'Kowalski',
  studentNumber: '123456',
  email: 'jan.kowalski@example.com',
  photoUrl: 'https://example.com/photo.jpg',
};

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

  it('returns nulls for a legacy token without the new fields', async () => {
    const { service, jwt } = createService();
    const legacyToken = jwt.sign({
      sub: user.id,
      usos_id: user.usos_id,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    await expect(service.verify(legacyToken)).resolves.toEqual({
      id: user.id,
      usos_id: user.usos_id,
      firstName: user.firstName,
      lastName: user.lastName,
      studentNumber: null,
      email: null,
      photoUrl: null,
    });
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
      usos_id: user.usos_id,
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
      {
        sub: user.id,
        usos_id: user.usos_id,
        firstName: user.firstName,
        lastName: user.lastName,
      },
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
