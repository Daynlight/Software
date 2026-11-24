import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SessionGuard } from '../auth/session.guard';
import { Group } from '../database/groups/groups.entity';
import { GroupMember } from '../database/groups_members/groups_members.entity';
import { JoinRequest } from '../database/join_requests/join-requests.entity';
import { UserDBModule } from '../database/users/users.module';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, GroupMember, JoinRequest]),
    AuthModule,
    UserDBModule,
  ],
  controllers: [GroupsController],
  providers: [GroupsService, SessionGuard],
})
export class GroupsModule {}
