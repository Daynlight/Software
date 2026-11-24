import { Client } from 'pg';
import { AppDataSource } from '../src/database/data-source';

export default async function globalSetup(): Promise<void> {
  const database = process.env.DB_DATABASE ?? 'pri_test';

  if (!/(^|_)test$/.test(database)) {
    throw new Error(
      `Refusing to reset non-test database "${database}". Set DB_DATABASE to a database whose name ends with _test.`,
    );
  }

  const admin = new Client({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USER ?? process.env.USER,
    password: process.env.DB_PASSWORD ?? '',
    database: 'postgres',
  });

  await admin.connect();
  const existing = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname = $1',
    [database],
  );
  if (existing.rowCount === 0) {
    await admin.query(`CREATE DATABASE "${database}"`);
  }
  await admin.end();

  await AppDataSource.initialize();
  await AppDataSource.query('DROP SCHEMA public CASCADE');
  await AppDataSource.query('CREATE SCHEMA public');
  await AppDataSource.runMigrations();
  await AppDataSource.destroy();
}
