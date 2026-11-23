import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/users.entity';
import { Group } from './groups/groups.entity';
import { GroupMember } from './groups_members/groups_members.entity'
import { UserDBModule } from './users/users.module';
import { GroupDBModule } from './groups/groups.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [
        User,
        Group,
        GroupMember
      ],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    UserDBModule,
    GroupDBModule,
  ],
})
export class DatabaseModule {}
