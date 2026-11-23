import { Test } from '@nestjs/testing';
import { DatabaseModule } from './database.module';

describe('DatabaseModule', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DB_HOST: 'localhost',
      DB_PORT: '5433',
      DB_USER: 'test_user',
      DB_PASSWORD: 'test_password',
      DB_DATABASE: 'test_db',
      NODE_ENV: 'development',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('compiles with Postgres configuration from environment variables', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    expect(moduleRef.get(DatabaseModule)).toBeInstanceOf(DatabaseModule);
    await moduleRef.close();
  });
});
