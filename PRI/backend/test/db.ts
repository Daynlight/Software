import { DataSource } from 'typeorm';

export async function clearDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    'TRUNCATE TABLE "join_requests", "group_members", "groups", "users" RESTART IDENTITY CASCADE',
  );
}
