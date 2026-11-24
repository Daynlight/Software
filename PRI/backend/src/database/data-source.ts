import { DataSource } from 'typeorm';
import { Group } from './groups/groups.entity';
import { GroupMember } from './groups_members/groups_members.entity';
import { JoinRequest } from './join_requests/join-requests.entity';
import { InitialSchema1732400000000 } from './migrations/1732400000000-InitialSchema';
import { User } from './users/users.entity';

export const databaseEntities = [User, Group, GroupMember, JoinRequest];

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? process.env.USER,
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'pri_test',
  entities: databaseEntities,
  migrations: [InitialSchema1732400000000],
  synchronize: false,
});
