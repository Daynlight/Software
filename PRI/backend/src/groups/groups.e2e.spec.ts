import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { SessionService } from '../auth/session.service';
import { User, UserRole } from '../database/users/users.entity';
import { UsosSessionUser } from '../auth/auth.types';
import { clearDatabase } from '../../test/db';

describe('Groups API', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let sessions: SessionService;
  let server: Parameters<typeof request>[0];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({ transform: true, whitelist: true }),
    );
    await app.init();

    dataSource = app.get(DataSource);
    sessions = app.get(SessionService);
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
  });

  async function createUser(
    usosId: number,
    role: UserRole = UserRole.STUDENT,
  ): Promise<{ user: User; cookie: string }> {
    const user = await dataSource.getRepository(User).save(
      dataSource.getRepository(User).create({
        usos_id: usosId,
        first_name: `Jan${usosId}`,
        last_name: `Kowalski${usosId}`,
        student_number: `S${usosId}`,
        email: `jan${usosId}@example.com`,
        role,
      }),
    );
    const session: UsosSessionUser = {
      id: user.id,
      usos_id: user.usos_id,
      firstName: user.first_name,
      lastName: user.last_name,
      studentNumber: user.student_number,
      email: user.email,
      photoUrl: null,
      role: user.role,
    };
    const token = await sessions.issue(session);

    return { user, cookie: `pri_session=${token}` };
  }

  it('rejects unauthenticated access', async () => {
    await request(server).get('/groups').expect(401);
  });

  it('creates a group for a student', async () => {
    const { cookie } = await createUser(1);

    const response = await request(server)
      .post('/groups')
      .set('Cookie', cookie)
      .send({
        name: 'Zespół A',
        description: 'Opis projektu inżynierskiego',
      })
      .expect(201);

    expect(response.body.name).toBe('Zespół A');
    expect(response.body.memberCount).toBe(1);
  });

  it('rejects invalid input and non-students', async () => {
    const { cookie } = await createUser(1);
    const { cookie: otherCookie } = await createUser(2, UserRole.OTHER);

    await request(server)
      .post('/groups')
      .set('Cookie', cookie)
      .send({ name: 'x', description: 'y' })
      .expect(400);

    await request(server)
      .post('/groups')
      .set('Cookie', otherCookie)
      .send({
        name: 'Zespół B',
        description: 'Opis projektu inżynierskiego',
      })
      .expect(403);
  });

  it('searches groups and validates path parameters', async () => {
    const { cookie } = await createUser(1);
    await request(server)
      .post('/groups')
      .set('Cookie', cookie)
      .send({
        name: 'Alpha',
        description: 'Aplikacja webowa',
      })
      .expect(201);

    const response = await request(server)
      .get('/groups?search=alpha&hasFreeSlots=true&sort=name&order=asc')
      .set('Cookie', cookie)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].name).toBe('Alpha');
    expect(response.body.page).toBe(1);

    await request(server)
      .post('/groups/not-a-uuid/join-requests')
      .set('Cookie', cookie)
      .expect(400);
  });


  it('returns the group roster to a member', async () => {
    const { cookie } = await createUser(1);
    const group = await request(server)
      .post('/groups')
      .set('Cookie', cookie)
      .send({
        name: 'Zespół A',
        description: 'Opis projektu inżynierskiego',
      })
      .expect(201);

    await request(server)
      .get(`/groups/${group.body.id}/members`)
      .set('Cookie', cookie)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toHaveLength(1);
        expect(body[0].role).toBe('LEADER');
      });
  });

  it('updates and leaves a group', async () => {
    const { cookie } = await createUser(1);
    const group = await request(server)
      .post('/groups')
      .set('Cookie', cookie)
      .send({
        name: 'Zespół A',
        description: 'Opis projektu inżynierskiego',
      })
      .expect(201);

    await request(server)
      .patch(`/groups/${group.body.id}`)
      .set('Cookie', cookie)
      .send({ name: 'Nowa nazwa' })
      .expect(200)
      .expect(({ body }) => {
        expect(body.name).toBe('Nowa nazwa');
      });

    await request(server)
      .post(`/groups/${group.body.id}/leave`)
      .set('Cookie', cookie)
      .expect(204);

    await request(server)
      .get('/groups?mine=true')
      .set('Cookie', cookie)
      .expect(200)
      .expect(({ body }) => {
        expect(body.items).toEqual([]);
      });
  });

  it('creates a join request for another student', async () => {
    const { cookie } = await createUser(1);
    const { cookie: applicantCookie } = await createUser(2);
    const group = await request(server)
      .post('/groups')
      .set('Cookie', cookie)
      .send({
        name: 'Zespół A',
        description: 'Opis projektu inżynierskiego',
      })
      .expect(201);

    const response = await request(server)
      .post(`/groups/${group.body.id}/join-requests`)
      .set('Cookie', applicantCookie)
      .expect(201);

    expect(response.body.request.status).toBe('PENDING');
    expect(response.body.warnings).toEqual([]);
  });
});
