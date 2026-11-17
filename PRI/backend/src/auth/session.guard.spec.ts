import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SessionGuard } from './session.guard';
import { SESSION_COOKIE } from './auth.constants';

const user = { id: '123', firstName: 'Jan', lastName: 'Kowalski' };

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createGuard(verifiedUser: typeof user | null) {
  const sessions = {
    verify: jest.fn().mockResolvedValue(verifiedUser),
  };

  return {
    guard: new SessionGuard(sessions as never),
    sessions,
  };
}

describe('SessionGuard', () => {
  it('authorizes a request with a valid session cookie', async () => {
    const { guard, sessions } = createGuard(user);
    const request = { cookies: { [SESSION_COOKIE]: 'session-token' } };

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);

    expect(sessions.verify).toHaveBeenCalledWith('session-token');
    expect(request).toMatchObject({ user });
  });

  it('rejects a request without a session cookie', async () => {
    const { guard, sessions } = createGuard(user);

    await expect(
      guard.canActivate(createContext({ cookies: {} })),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(sessions.verify).not.toHaveBeenCalled();
  });

  it('rejects a request without parsed cookies', async () => {
    const { guard } = createGuard(user);

    await expect(guard.canActivate(createContext({}))).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects a request with an invalid session', async () => {
    const { guard } = createGuard(null);
    const request = { cookies: { [SESSION_COOKIE]: 'invalid-token' } };

    await expect(
      guard.canActivate(createContext(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
