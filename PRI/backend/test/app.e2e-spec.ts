import { BadGatewayException, INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { UsosOAuthClient } from './../src/auth/usos-oauth.client';

describe('Application (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(UsosOAuthClient)
      .useValue({
        requestToken: jest
          .fn()
          .mockRejectedValue(new BadGatewayException('USOS unavailable')),
        exchangeToken: jest.fn(),
        fetchUser: jest.fn(),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect(({ body }) => {
        expect(body.status).toBe('healthy');
      });
  });

  it('/auth/me (GET) requires a session', () => {
    return request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('/auth/logout (POST) clears the session', () => {
    return request(app.getHttpServer()).post('/auth/logout').expect(204);
  });

  it('/auth/usos/login (GET) returns to the login page when USOS fails', () => {
    return request(app.getHttpServer())
      .get('/auth/usos/login')
      .expect(302)
      .expect('Location', 'http://localhost:8090/login?error=usos_unavailable');
  });
});
