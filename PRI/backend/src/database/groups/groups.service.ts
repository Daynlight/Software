import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Group } from './groups.entity';
import { GroupMember, MemberRole, GroupPermission, PERMISSIONS } from '../groups_members/groups_members.entity';

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly membersRepository: Repository<GroupMember>,
  ) {}

  // ==== Autoryzacja ==== //
  private getActiveMember(group_id: string, user_id: string): Promise<GroupMember | null> {
    return this.membersRepository.findOne({
      where: { group_id, user_id, leftAt: IsNull() },
    });
  }

  async getRole(group_id: string, user_id: string): Promise<MemberRole | null> {
    return (await this.getActiveMember(group_id, user_id))?.role ?? null;
  }

  private async assertPermission(
    group_id: string,
    user_id: string,
    permission: GroupPermission,
  ): Promise<GroupMember> {
    const member = await this.getActiveMember(group_id, user_id);
    if (!member) {
      throw new ForbiddenException('Użytkownik nie jest członkiem tej grupy');
    }
    if (!PERMISSIONS[member.role].includes(permission)) {
      throw new ForbiddenException(`Rola ${member.role} nie ma uprawnienia ${permission}`);
    }
    return member;
  }

  private async getActiveGroupOrThrow(group_id: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({ where: { id: group_id } });
    if (!group) throw new NotFoundException(`Group ${group_id} not found`);
    if (group.endedAt !== null) throw new ConflictException('Grupa jest już zakończona');
    return group;
  }

  async isLeader(group_id: string, user_id: string): Promise<boolean> {
    return (await this.getRole(group_id, user_id)) === MemberRole.LEADER;
  }

  async isMember(group_id: string, user_id: string): Promise<boolean> {
    return (await this.getRole(group_id, user_id)) !== null;
  }

  // ==== Odczyt ==== //
  async getGroup(group_id: string, actor_id: string): Promise<Group> {
    await this.assertPermission(group_id, actor_id, GroupPermission.VIEW_GROUP);
    const group = await this.groupsRepository.findOne({ where: { id: group_id } });
    if (!group) throw new NotFoundException(`Group ${group_id} not found`);
    return group;
  }

  findAllByUser(user_id: string): Promise<Group[]> {
    return this.groupsRepository.find({
      where: { groupMembers: { user_id, leftAt: IsNull() } },
    });
  }

  async getMembers(group_id: string, actor_id: string, includeInactive = false): Promise<GroupMember[]> {
    await this.assertPermission(group_id, actor_id, GroupPermission.VIEW_MEMBERS);
    return this.membersRepository.find({
      where: includeInactive
        ? { group_id }
        : { group_id, leftAt: IsNull() },
      order: { joinedAt: 'ASC' },
    });
  }

  // ==== Tworzenie / zakończenie / edycja grupy ==== //
  async createGroup(owner_id: string, name: string, description?: string | null): Promise<Group> {
    const existing = await this.groupsRepository.findOne({
      where: { owner_id, name, endedAt: IsNull() },
    });
    if (existing) throw new ConflictException('Aktywna grupa o tej nazwie już istnieje');

    return this.groupsRepository.manager.transaction(async (em) => {
      const group = await em.save(
        em.create(Group, { owner_id, name, description: description ?? null }),
      );
      await em.save(
        em.create(GroupMember, {
          group_id: group.id,
          user_id: owner_id,
          role: MemberRole.LEADER,
          leftAt: null,
        }),
      );
      return group;
    });
  }

  async endGroup(group_id: string, actor_id: string): Promise<Group> {
    await this.assertPermission(group_id, actor_id, GroupPermission.END_GROUP);
    const group = await this.getActiveGroupOrThrow(group_id);
    group.endedAt = new Date();
    return this.groupsRepository.save(group);
  }

  async updateGroup(
    group_id: string,
    actor_id: string,
    data: { name?: string; description?: string | null },
  ): Promise<Group> {
    await this.assertPermission(group_id, actor_id, GroupPermission.EDIT_GROUP);
    const group = await this.getActiveGroupOrThrow(group_id);
    Object.assign(group, data);
    return this.groupsRepository.save(group);
  }

  // ==== Zarządzanie członkami ==== //
  async addMember(group_id: string, actor_id: string, user_id: string): Promise<GroupMember> {
    await this.assertPermission(group_id, actor_id, GroupPermission.MANAGE_MEMBERS);
    await this.getActiveGroupOrThrow(group_id);

    if (await this.getActiveMember(group_id, user_id)) {
      throw new ConflictException(`Użytkownik ${user_id} już jest członkiem grupy`);
    }

    try {
      return await this.membersRepository.save(
        this.membersRepository.create({
          group_id,
          user_id,
          role: MemberRole.MEMBER,
          leftAt: null,
        }),
      );
    } catch (err: any) {
      if (err?.code === '23505') {
        throw new ConflictException(`Użytkownik ${user_id} już jest członkiem grupy`);
      }
      throw err;
    }
  }

  async removeMember(groupId: string, actorId: string, userId: string): Promise<GroupMember> {
    await this.assertPermission(groupId, actorId, GroupPermission.MANAGE_MEMBERS);
    await this.getActiveGroupOrThrow(groupId);

    if (actorId === userId) {
      throw new ForbiddenException('Aby opuścić grupę, użyj operacji opuszczenia grupy');
    }
    const target = await this.getActiveMember(groupId, userId);
    if (!target) throw new NotFoundException(`Użytkownik ${userId} nie jest członkiem grupy`);
    target.leftAt = new Date();
    return this.membersRepository.save(target);
  }

  async leaveGroup(groupId: string, actorId: string): Promise<GroupMember> {
    const member = await this.assertPermission(groupId, actorId, GroupPermission.LEAVE_GROUP);
    await this.getActiveGroupOrThrow(groupId);

    if (member.role === MemberRole.LEADER) {
      throw new ConflictException('Lider musi przekazać rolę lidera przed opuszczeniem grupy');
    }
    member.leftAt = new Date();
    return this.membersRepository.save(member);
  }

  async setMemberRole(
    groupId: string,
    actorId: string,
    userId: string,
    role: MemberRole,
  ): Promise<void> {
    await this.assertPermission(groupId, actorId, GroupPermission.MANAGE_MEMBERS);
    await this.getActiveGroupOrThrow(groupId);

    if (actorId === userId) {
      throw new ForbiddenException('Nie można zmienić własnej roli');
    }
    if (role === MemberRole.LEADER) {
      return this.transferLeadership(groupId, actorId, userId);
    }
    const target = await this.getActiveMember(groupId, userId);
    if (!target) throw new NotFoundException(`Użytkownik ${userId} nie jest członkiem grupy`);
    target.role = role;
    await this.membersRepository.save(target);
  }

  async transferLeadership(groupId: string, actorId: string, newLeaderId: string): Promise<void> {
    await this.assertPermission(groupId, actorId, GroupPermission.TRANSFER_LEADERSHIP);
    await this.getActiveGroupOrThrow(groupId);

    if (actorId === newLeaderId) {
      throw new ConflictException('Użytkownik już jest liderem');
    }

    await this.groupsRepository.manager.transaction(async (em) => {
      const memberRepo = em.getRepository(GroupMember);
      const groupRepo = em.getRepository(Group);
      const where = (user_id: string) => ({ group_id: groupId, user_id, leftAt: IsNull() });

      const oldLeader = await memberRepo.findOne({ where: where(actorId) });
      const newLeader = await memberRepo.findOne({ where: where(newLeaderId) });
      if (!oldLeader) throw new ForbiddenException('Użytkownik nie jest członkiem tej grupy');
      if (!newLeader) throw new NotFoundException('Nowy lider musi być aktywnym członkiem grupy');

      oldLeader.role = MemberRole.MEMBER;
      newLeader.role = MemberRole.LEADER;
      await memberRepo.save([oldLeader, newLeader]);

      await groupRepo.update({ id: groupId }, { owner_id: newLeaderId });
    });
  }
}

