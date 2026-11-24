import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfiguration } from '../config/configuration';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseEntities } from './data-source';
import { InitialSchema1732400000000 } from './migrations/1732400000000-InitialSchema';
import { UserDBModule } from './users/users.module';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const database = config.get<AppConfiguration['database']>('database');

        return {
          type: 'postgres' as const,
          host: database.host,
          port: database.port,
          username: database.username,
          password: database.password,
          database: database.database,
          entities: databaseEntities,
          migrations: [InitialSchema1732400000000],
          migrationsRun: true,
          synchronize: false,
        };
      },
    }),
    UserDBModule,
  ],
})
export class DatabaseModule {}
