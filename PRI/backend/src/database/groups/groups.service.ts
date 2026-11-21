import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Group } from './groups.entity';
import { GroupMember, MemberRole } from '../groups_members/groups_members.entity';

export interface GroupMemberWithRole {
  id: string;
  group_id: string;
  user_id: number;
  role: string;
  joinedAt: Date;
  leftAt: Date | null;
}

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMembersRepository: Repository<GroupMember>,
  ) {}



  // ==== Getters ==== //
  async findByUUID(id: string): Promise<Group | null> {
    return this.groupsRepository.findOne({ where: { id } });
  }
  
  async findByOwnerIDAndName(user_id: number, name: string): Promise<Group | null> {
    if (name.trim().length == 0) return null;
    return this.groupsRepository.findOne({ where: { name, groupMembers: { user_id, role: 'owner', leftAt: IsNull() }}});
  }
 
  async findByUserIDAndName(user_id: number, name: string): Promise<Group | null> {
    if (name.trim().length == 0) return null;
    return this.groupsRepository.findOne({where: { name, groupMembers: { user_id, leftAt: IsNull() }}});
  }

  async findAllByOwnerID(user_id: number): Promise<Group[]> {
    return this.groupsRepository.find({ where: { groupMembers: { user_id, role: 'owner', leftAt: IsNull() }}});
  }
  
  async findAllByUserID(user_id: number): Promise<Group[]> {
    return this.groupsRepository.find({where: { groupMembers: { user_id, leftAt: IsNull() }}});
  }
 
  async getGroupMembers(groupId: string, includeInactive = false): Promise<GroupMemberWithRole[]> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    const members = await this.groupMembersRepository.find({
      where: includeInactive ? { group_id: groupId } : { group_id: groupId, leftAt: IsNull() },
      order: { joinedAt: 'ASC' },
    });

    return members.map((m) => ({
      id: m.id,
      group_id: m.group_id,
      user_id: m.user_id,
      role: m.role,
      joinedAt: m.joinedAt,
      leftAt: m.leftAt,
    }));
  }



  // ==== Setters ==== //
  async createGroup(owner_id: number, name: string, description?: string | null): Promise<Group | null> {
    const existing = await this.findByOwnerIDAndName(owner_id, name);
    if (existing) {
      return null;
    }

    const newGroup = this.groupsRepository.create({ name, description });
    const savedGroup = await this.groupsRepository.save(newGroup);

    const ownerMember = this.groupMembersRepository.create({
      group_id: savedGroup.id,
      user_id: owner_id,
      role: 'owner',
      leftAt: null,
    });
    await this.groupMembersRepository.save(ownerMember);

    return savedGroup;
  }

  async endProjectByUUID(groupId: string): Promise<boolean> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId }});
    if (!group) return false;
    if (group.endedAt !== null) return false;

    group.endedAt = new Date();
    await this.groupsRepository.save(group);

    return true;
  }

  async addUserToGroup(groupId: string, userId: number, role: string = 'member'): Promise<GroupMember> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    const activeMember = await this.groupMembersRepository.findOne({
      where: {
        group_id: groupId,
        user_id: userId,
        leftAt: IsNull(),
      },
    });
    if (activeMember) {
      throw new ConflictException(
        `User ${userId} is already an active member of group ${groupId}`,
      );
    }

    const member = this.groupMembersRepository.create({
      group_id: groupId,
      user_id: userId,
      role,
      leftAt: null,
    });

    return this.groupMembersRepository.save(member);
  }

  async removeUserFromGroup(groupId: string, userId: number): Promise<GroupMember> {
    const activeMember = await this.groupMembersRepository.findOne({ where: { group_id: groupId, user_id: userId, leftAt: IsNull() }});
    if (!activeMember) {
      throw new NotFoundException(
        `Active membership for user ${userId} in group ${groupId} not found`,
      );
    }

    activeMember.leftAt = new Date();

    return this.groupMembersRepository.save(activeMember);
  }

  async assignRoleForUserInGroup(groupId: string, userId: number, role: MemberRole): Promise<GroupMember> {
    const activeMember = await this.groupMembersRepository.findOne({ where: { group_id: groupId, user_id: userId, leftAt: IsNull() }});
    if (!activeMember) {
      throw new NotFoundException(
        `Active membership for user ${userId} in group ${groupId} not found`,
      );
    }

    activeMember.role = role;
    return this.groupMembersRepository.save(activeMember);
  }

  async setDescription(groupId: string, description: string | null): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    group.description = description;
    return this.groupsRepository.save(group);
  }

  async setName(groupId: string, name: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { id: groupId } });
    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    group.name = name;
    return this.groupsRepository.save(group);
  }
}



