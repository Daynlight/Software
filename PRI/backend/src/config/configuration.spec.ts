import configuration from './configuration';
import { validateEnvironment } from './environment';

const validEnvironment = {
  USOS_API_BASE_URL: 'https://usosapps.amu.edu.pl',
  USOS_CONSUMER_KEY: 'consumer-key',
  USOS_CONSUMER_SECRET: 'consumer-secret',
  USOS_CALLBACK_URL: 'http://localhost:8090/api/auth/usos/callback',
  FRONTEND_URL: 'http://localhost:8090',
  SESSION_SECRET: 'a'.repeat(64),
  DB_HOST: '127.0.0.1',
  DB_PORT: '5432',
  DB_USER: 'root',
  DB_PASSWORD: 'secret',
  DB_DATABASE: 'pri',
};

describe('validateEnvironment', () => {
  it('accepts a complete configuration', () => {
    expect(validateEnvironment({ ...validEnvironment })).toEqual(
      validEnvironment,
    );
  });

  it('accepts optional settings', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        PORT: '3000',
        SESSION_TTL_SECONDS: '3600',
        USOS_SCOPES: 'email|studies',
      }),
    ).not.toThrow();
  });

  it('rejects a missing consumer key', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        USOS_CONSUMER_KEY: undefined,
      }),
    ).toThrow('Invalid environment configuration');
  });

  it('rejects a non-https USOS base URL', () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        USOS_API_BASE_URL: 'http://usosapps.amu.edu.pl',
      }),
    ).toThrow('USOS_API_BASE_URL');
  });

  it('rejects a session secret shorter than 32 characters', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, SESSION_SECRET: 'too-short' }),
    ).toThrow('SESSION_SECRET');
  });

  it('rejects a non-numeric port', () => {
    expect(() =>
      validateEnvironment({ ...validEnvironment, PORT: 'not-a-port' }),
    ).toThrow('PORT');
  });
});

describe('configuration', () => {
  const environmentKeys = [
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL',
    'SESSION_SECRET',
    'SESSION_TTL_SECONDS',
    'USOS_API_BASE_URL',
    'USOS_CONSUMER_KEY',
    'USOS_CONSUMER_SECRET',
    'USOS_CALLBACK_URL',
    'USOS_SCOPES',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASSWORD',
    'DB_DATABASE',
  ] as const;
  const originalEnvironment = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  function load(overrides: Record<string, string | undefined>) {
    for (const key of environmentKeys) {
      delete process.env[key];
    }
    Object.assign(process.env, validEnvironment, overrides);

    return configuration();
  }

  it('maps environment variables to the application configuration', () => {
    const config = load({
      NODE_ENV: 'production',
      PORT: '4000',
      SESSION_TTL_SECONDS: '3600',
      USOS_SCOPES: 'email|studies',
    });

    expect(config).toEqual({
      port: 4000,
      frontendUrl: 'http://localhost:8090',
      cookiesSecure: true,
      sessionSecret: 'a'.repeat(64),
      sessionTtlSeconds: 3600,
      database: {
        host: '127.0.0.1',
        port: 5432,
        username: 'root',
        password: 'secret',
        database: 'pri',
      },
      usos: {
        baseUrl: 'https://usosapps.amu.edu.pl',
        consumerKey: 'consumer-key',
        consumerSecret: 'consumer-secret',
        callbackUrl: 'http://localhost:8090/api/auth/usos/callback',
        scopes: 'email|studies',
      },
    });
  });

  it('applies development defaults', () => {
    const config = load({ NODE_ENV: 'development' });

    expect(config.port).toBe(3000);
    expect(config.cookiesSecure).toBe(false);
    expect(config.sessionTtlSeconds).toBe(86400);
    expect(config.usos.scopes).toBe('');
  });

  it('applies database defaults when DB variables are missing', () => {
    for (const key of [
      'DB_HOST',
      'DB_PORT',
      'DB_USER',
      'DB_PASSWORD',
      'DB_DATABASE',
    ]) {
      delete process.env[key];
    }

    const config = configuration();

    expect(config.database).toEqual({
      host: '127.0.0.1',
      port: 5432,
      username: process.env.USER,
      password: '',
      database: 'pri_test',
    });
  });

  it('removes trailing slashes from URLs', () => {
    const config = load({
      FRONTEND_URL: 'http://localhost:8090/',
      USOS_API_BASE_URL: 'https://usosapps.amu.edu.pl///',
    });

    expect(config.frontendUrl).toBe('http://localhost:8090');
    expect(config.usos.baseUrl).toBe('https://usosapps.amu.edu.pl');
  });
});
