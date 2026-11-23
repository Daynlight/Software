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



  // ==== Get Group ==== //
  async findByUUID(group_id: string): Promise<Group | null> {
    return this.groupsRepository.findOne({ 
      where: { 
        group_id: group_id, 
      } 
    });
  }
  
  async findByOwnerIDAndName(owner_id: string, name: string): Promise<Group | null> {
    if (name.trim().length == 0) return null;

    return this.groupsRepository.findOne({ 
      where: { 
        name: name, 
        owner_id: owner_id, 
      }
    });
  }
 
  async findByUserIDAndName(user_id: string, name: string): Promise<Group | null> {
    if (name.trim().length == 0) return null;
    
    return this.groupsRepository.findOne({
      where: { 
        name: name, 
        groupMembers: { 
          user_id: user_id, 
          leftAt: IsNull() 
        }
      }
    });
  }

  async findAllByOwnerID(owner_id: string): Promise<Group[]> {
    return this.groupsRepository.find({ 
      where: {
        owner_id: owner_id,
      }
    });
  }
  
  async findAllByUserID(user_id: string): Promise<Group[]> {
    return this.groupsRepository.find({
      where: { 
        groupMembers: { 
          user_id: user_id, 
          leftAt: IsNull() 
        }
      }
    });
  }



  // ==== Validate Users ==== //
  async getGroupMembers(group_id: string, includeInactive = false): Promise<GroupMemberWithRole[]> {
    const group = await this.groupsRepository.findOne({ 
      where: { 
        id: group_id 
      } 
    });

    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    const members = await this.groupMembersRepository.find({
      where: includeInactive ? { group_id: groupId } : { group_id: groupId, leftAt: IsNull() },
      order: { 
        joinedAt: 'ASC' 
      },
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

  async getGroupMemberInfo(group_id: string, user_id: string): Promise<GroupMemberWithRole> {
    const group = await this.groupsRepository.findOne({ 
      where: { 
        id: group_id 
      } 
    });

    if (!group) {
      throw new NotFoundException(`Group ${groupId} not found`);
    }

    const member = await this.groupMembersRepository.findOne({
      where: { 
        group_id: group_id, 
        leftAt: IsNull() 
      },
      order: { 
        joinedAt: 'ASC' 
      },
    });

    return {
      id:       member.id,
      group_id: member.group_id,
      user_id:  member.user_id,
      role:     member.role,
      joinedAt: member.joinedAt,
      leftAt:   member.leftAt,
    };
  }
  
  async isOwnerOfGroup(group_id: string, user_id: number): Promise<boolean> {
    const group = await findByUUID(group_id);
    if (group.owner_id == user_id) return true;
    return false;
  }
  
  async isLeaderOfGroup(group_id: string, user_id: number): Promise<boolean> {
    const user = await getGroupMember(group_id, user_id);
    if (user.role == 'LEADER') return true;
    return false;
  }
  
  async isMemberOfGroup(group_id: string, user_id: number): Promise<boolean> {
    const user = await getGroupMember(group_id, user_id);
    if (user.role == 'MEMBER' || user.role == "LEADER") return true;
    return false;
  }



  // ==== Group Create/End ==== //
  async createGroup(owner_id: string, name: string, description?: string | null): Promise<Group | null> {
    const existing = await this.findByOwnerIDAndName(owner_id, name);
    if (existing) {
      return null;
    }

    const newGroup = this.groupsRepository.create({ owner_id, name, description });
    const savedGroup = await this.groupsRepository.save(newGroup);

    const ownerMember = this.groupMembersRepository.create({
      group_id: savedGroup.id,
      user_id: owner_id,
      role: 'LEADER',
      leftAt: null,
    });
    await this.groupMembersRepository.save(ownerMember);

    return savedGroup;
  }

  async endProjectByUUID(groupId: string, user_id: string): Promise<boolean> {
    if(!isLEaderOfGroup(group_id, user_id)) return false;

    const group = await this.groupsRepository.findOne({ where: { id: groupId }});
    if (!group) return false;
    if (group.endedAt !== null) return false;

    group.endedAt = new Date();
    await this.groupsRepository.save(group);

    return true;
  }



  // ==== Manage members in group ==== //
  async setLeader(group_id: string, user_id: string, new_leader_id: string): Promise<boolean> {
    if(!isLeaderOfGroup(group_id, user_id)) return false;
    
    const ownerMember = this.groupMembersRepository.create({
      group_id: group_id,
      user_id: new_leader_id,
      role: 'LEADER',
      leftAt: null,
    });
    
    ownerMember.delete({
      where: {
        group_id: group_id,
        user_id: user_id,
        role: "LEADER",
        leftAt: null,
      }
    });

    await this.groupMembersRepository.save(ownerMember);
    return true;
  }

  async addUserToGroup(groupId: string, leader_id: string, userId: number, role: string = 'member'): Promise<boolean> {
    if (!isLeaderOfGroup(groupID, leader_id)) return false; 
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

    await this.groupMembersRepository.save(member);
    return true;
  }

  async removeUserFromGroup(groupId: string, leader_id: string, userId: number): Promise<GroupMember> {
    if (!isLeaderOfGroup(groupID, leader_id)) return false; 
    
    const activeMember = await this.groupMembersRepository.findOne({ where: { group_id: groupId, user_id: userId, leftAt: IsNull() }});
    if (!activeMember) {
      throw new NotFoundException(
        `Active membership for user ${userId} in group ${groupId} not found`,
      );
    }

    activeMember.leftAt = new Date();

    return this.groupMembersRepository.save(activeMember);
  }

  

  // ==== Manage group info ==== //
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

