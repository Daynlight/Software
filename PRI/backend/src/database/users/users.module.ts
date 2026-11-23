import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users.entity';
import { GroupMember } from '../groups_members/groups_members.entity'
import { UsersService } from './users.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, GroupMember])],
  providers: [UsersService],
  exports: [UsersService],
})
export class UserDBModule {}
