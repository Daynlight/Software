import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './groups.entity';
import { GroupMember } from '../groups_members/groups_members.entity'
import { GroupsService } from './groups.service';

@Module({
  imports: [TypeOrmModule.forFeature([Group, GroupMember])],
  providers: [GroupsService],
  exports: [GroupsService],
})
export class GroupDBModule {}
