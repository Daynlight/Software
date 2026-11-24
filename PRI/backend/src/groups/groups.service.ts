import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Not, QueryFailedError, Repository } from 'typeorm';
import {
  JoinRequest,
  JoinRequestStatus,
} from '../database/join_requests/join-requests.entity';
import {
  GroupMember,
  MemberRole,
} from '../database/groups_members/groups_members.entity';
import { Group } from '../database/groups/groups.entity';
import { User, UserRole } from '../database/users/users.entity';
import { UsosSessionUser } from '../auth/auth.types';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { ListJoinRequestsQueryDto } from './dto/list-join-requests.dto';
import { SearchGroupsQueryDto } from './dto/search-groups.dto';
import {
  MAX_MEMBERS,
  RECOMMENDED_MEMBERS,
  groupSizeWarnings,
} from './groups.constants';
import {
  GroupSummary,
  JoinRequestResult,
  JoinRequestView,
  Paginated,
} from './groups.types';

interface AcceptSuccess {
  status: 'ok';
  request: JoinRequest;
  target: User;
  memberCount: number;
}

interface AcceptConflict {
  status: 'conflict';
  reason: 'USER_IN_GROUP' | 'GROUP_FULL';
}

type AcceptOutcome = AcceptSuccess | AcceptConflict;

@Injectable()
export class GroupsService {
  constructor(
    @InjectRepository(Group)
    private readonly groupsRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly membersRepository: Repository<GroupMember>,
    @InjectRepository(JoinRequest)
    private readonly requestsRepository: Repository<JoinRequest>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    user: UsosSessionUser,
    dto: CreateGroupDto,
  ): Promise<GroupSummary> {
    this.assertStudent(user);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const existingMembership = await manager.findOne(GroupMember, {
          where: { user_id: user.id },
        });

        if (existingMembership) {
          throw new ConflictException('Użytkownik należy już do grupy');
        }

        const group = manager.create(Group, {
          name: dto.name,
          description: dto.description,
          leader_id: user.id,
          member_count: 1,
        });
        await manager.save(group);

        await manager.save(
          manager.create(GroupMember, {
            group_id: group.id,
            user_id: user.id,
            role: MemberRole.LEADER,
          }),
        );

        await manager.update(
          JoinRequest,
          { user_id: user.id, status: JoinRequestStatus.PENDING },
          { status: JoinRequestStatus.CANCELLED },
        );

        return this.toSummary(
          group,
          {
            id: user.id,
            first_name: user.firstName,
            last_name: user.lastName,
          },
          true,
          JoinRequestStatus.ACCEPTED,
        );
      });
    } catch (error) {
      this.rethrowUnique(error, 'Użytkownik należy już do grupy');
      throw error;
    }
  }

  async update(
    user: UsosSessionUser,
    groupId: string,
    dto: UpdateGroupDto,
  ): Promise<GroupSummary> {
    await this.assertLeader(groupId, user.id);

    if (dto.name === undefined && dto.description === undefined) {
      throw new BadRequestException('Podaj nazwę lub opis grupy');
    }

    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
      relations: { leader: true },
    });

    if (dto.name !== undefined) {
      group.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      group.description = dto.description.trim();
    }

    await this.groupsRepository.save(group);

    return this.toSummary(
      group,
      group.leader,
      true,
      JoinRequestStatus.ACCEPTED,
    );
  }

  async leave(user: UsosSessionUser, groupId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const group = await manager
        .getRepository(Group)
        .createQueryBuilder('g')
        .setLock('pessimistic_write')
        .where('g.id = :groupId', { groupId })
        .getOne();

      if (!group) {
        throw new NotFoundException('Grupa nie istnieje');
      }

      const membership = await manager.findOne(GroupMember, {
        where: { group_id: groupId, user_id: user.id },
      });

      if (!membership) {
        throw new ForbiddenException('Nie należysz do tej grupy');
      }

      if (group.member_count <= 1) {
        await manager.remove(group);
        return;
      }

      if (membership.role === MemberRole.LEADER) {
        const newLeader = await manager
          .getRepository(GroupMember)
          .createQueryBuilder('member')
          .where('member.group_id = :groupId', { groupId })
          .andWhere('member.user_id != :userId', { userId: user.id })
          .orderBy('RANDOM()')
          .limit(1)
          .getOne();

        if (!newLeader) {
          await manager.remove(group);
          return;
        }

        await manager.remove(membership);
        newLeader.role = MemberRole.LEADER;
        await manager.save(newLeader);
        group.leader_id = newLeader.user_id;
      } else {
        await manager.remove(membership);
      }

      group.member_count -= 1;
      await manager.save(group);
    });
  }

  async search(
    user: UsosSessionUser,
    query: SearchGroupsQueryDto,
  ): Promise<Paginated<GroupSummary>> {
    const builder = this.groupsRepository
      .createQueryBuilder('g')
      .innerJoinAndSelect('g.leader', 'leader');

    if (query.search) {
      const search = this.likePattern(query.search);
      builder.andWhere(
        `(g.name ILIKE :search OR g.description ILIKE :search OR leader.first_name ILIKE :search OR leader.last_name ILIKE :search)`,
        { search },
      );
    }

    if (query.leader) {
      const leader = this.likePattern(query.leader);
      builder.andWhere(
        `(leader.first_name || ' ' || leader.last_name) ILIKE :leader`,
        { leader },
      );
    }

    if (query.mine) {
      builder.andWhere(
        'EXISTS (SELECT 1 FROM group_members membership WHERE membership.group_id = g.id AND membership.user_id = :currentUserId)',
        { currentUserId: user.id },
      );
    }

    if (query.hasFreeSlots !== undefined) {
      builder.andWhere(
        query.hasFreeSlots
          ? 'g.member_count < :maxMembers'
          : 'g.member_count >= :maxMembers',
        { maxMembers: MAX_MEMBERS },
      );
    }

    if (query.minFreeSlots !== undefined) {
      builder.andWhere(':maxMembers - g.member_count >= :minFreeSlots', {
        maxMembers: MAX_MEMBERS,
        minFreeSlots: query.minFreeSlots,
      });
    }

    const sortColumn =
      query.sort === 'createdAt'
        ? 'g.created_at'
        : query.sort === 'name'
          ? 'g.name'
          : 'g.member_count';
    const sortOrder =
      query.sort === 'freeSlots'
        ? query.order === 'asc'
          ? 'DESC'
          : 'ASC'
        : query.order.toUpperCase();
    builder
      .orderBy(sortColumn, sortOrder as 'ASC' | 'DESC')
      .addOrderBy('g.id', 'ASC');
    builder.skip((query.page - 1) * query.limit).take(query.limit);

    const [groups, total] = await builder.getManyAndCount();
    const groupIds = groups.map((group) => group.id);
    const memberships = groupIds.length
      ? await this.membersRepository.find({
          where: { user_id: user.id, group_id: In(groupIds) },
        })
      : [];
    const pendingRequests = groupIds.length
      ? await this.requestsRepository.find({
          where: {
            user_id: user.id,
            group_id: In(groupIds),
            status: JoinRequestStatus.PENDING,
          },
        })
      : [];

    const memberGroupIds = new Set(
      memberships.map((member) => member.group_id),
    );
    const pendingGroupIds = new Set(
      pendingRequests.map((request) => request.group_id),
    );

    return {
      items: groups.map((group) =>
        this.toSummary(
          group,
          group.leader,
          memberGroupIds.has(group.id),
          memberGroupIds.has(group.id)
            ? JoinRequestStatus.ACCEPTED
            : pendingGroupIds.has(group.id)
              ? JoinRequestStatus.PENDING
              : null,
        ),
      ),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    };
  }

  async requestToJoin(
    user: UsosSessionUser,
    groupId: string,
  ): Promise<JoinRequestResult> {
    this.assertStudent(user);
    const group = await this.getGroupOrThrow(groupId);

    const membership = await this.membersRepository.findOne({
      where: { user_id: user.id },
    });
    if (membership) {
      throw new ConflictException('Użytkownik należy już do grupy');
    }

    const pending = await this.requestsRepository.findOne({
      where: {
        user_id: user.id,
        group_id: groupId,
        status: JoinRequestStatus.PENDING,
      },
    });
    if (pending) {
      throw new ConflictException(
        'Użytkownik ma już oczekującą prośbę do tej grupy',
      );
    }

    try {
      const request = await this.requestsRepository.save(
        this.requestsRepository.create({
          group_id: groupId,
          user_id: user.id,
          status: JoinRequestStatus.PENDING,
        }),
      );

      return {
        request: this.toRequestView(request, {
          id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          student_number: user.studentNumber,
          email: user.email,
        }),
        warnings: groupSizeWarnings(group.member_count),
      };
    } catch (error) {
      this.rethrowUnique(
        error,
        'Użytkownik ma już oczekującą prośbę do tej grupy',
      );
      throw error;
    }
  }

  async listRequests(
    user: UsosSessionUser,
    groupId: string,
    query: ListJoinRequestsQueryDto,
  ): Promise<Paginated<JoinRequestView>> {
    await this.assertLeader(groupId, user.id);

    const builder = this.requestsRepository
      .createQueryBuilder('request')
      .innerJoinAndSelect('request.user', 'user')
      .where('request.group_id = :groupId', { groupId })
      .orderBy('request.created_at', 'ASC')
      .addOrderBy('request.id', 'ASC')
      .skip((query.page - 1) * query.limit)
      .take(query.limit);

    if (query.status !== 'ALL') {
      builder.andWhere('request.status = :status', { status: query.status });
    }

    const [requests, total] = await builder.getManyAndCount();

    return {
      items: requests.map((request) =>
        this.toRequestView(request, request.user),
      ),
      page: query.page,
      limit: query.limit,
      total,
      totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
    };
  }

  async accept(
    user: UsosSessionUser,
    groupId: string,
    requestId: string,
  ): Promise<JoinRequestResult> {
    await this.assertLeader(groupId, user.id);

    let outcome: AcceptOutcome;
    try {
      outcome = await this.dataSource.transaction<AcceptOutcome>(
        async (manager) => {
          const group = await manager
            .getRepository(Group)
            .createQueryBuilder('g')
            .setLock('pessimistic_write')
            .where('g.id = :groupId', { groupId })
            .getOne();

          const request = await manager
            .getRepository(JoinRequest)
            .createQueryBuilder('request')
            .setLock('pessimistic_write')
            .where('request.id = :requestId', { requestId })
            .andWhere('request.group_id = :groupId', { groupId })
            .getOne();

          if (!request) {
            throw new NotFoundException('Prośba nie istnieje');
          }

          if (request.status !== JoinRequestStatus.PENDING) {
            throw new ConflictException('Prośba nie jest oczekująca');
          }

          const existingMembership = await manager.findOne(GroupMember, {
            where: { user_id: request.user_id },
          });

          if (existingMembership) {
            request.status = JoinRequestStatus.CANCELLED;
            request.decided_by = user.id;
            request.decided_at = new Date();
            await manager.save(request);
            return { status: 'conflict', reason: 'USER_IN_GROUP' };
          }

          if (group.member_count >= MAX_MEMBERS) {
            return { status: 'conflict', reason: 'GROUP_FULL' };
          }

          await manager.save(
            manager.create(GroupMember, {
              group_id: groupId,
              user_id: request.user_id,
              role: MemberRole.MEMBER,
            }),
          );

          group.member_count += 1;
          await manager.save(group);

          request.status = JoinRequestStatus.ACCEPTED;
          request.decided_by = user.id;
          request.decided_at = new Date();
          await manager.save(request);

          await manager.update(
            JoinRequest,
            {
              user_id: request.user_id,
              status: JoinRequestStatus.PENDING,
              id: Not(request.id),
            },
            {
              status: JoinRequestStatus.CANCELLED,
              decided_by: user.id,
              decided_at: new Date(),
            },
          );

          const target = await manager.findOne(User, {
            where: { id: request.user_id },
          });

          return {
            status: 'ok',
            request,
            target,
            memberCount: group.member_count,
          };
        },
      );
    } catch (error) {
      this.rethrowUnique(error, 'Użytkownik należy już do innej grupy');
      throw error;
    }

    if (outcome.status === 'conflict') {
      throw new ConflictException(
        outcome.reason === 'GROUP_FULL'
          ? 'Grupa osiągnęła maksymalną liczbę członków'
          : 'Użytkownik należy już do innej grupy',
      );
    }

    return {
      request: this.toRequestView(outcome.request, outcome.target),
      warnings: groupSizeWarnings(outcome.memberCount),
    };
  }

  async reject(
    user: UsosSessionUser,
    groupId: string,
    requestId: string,
  ): Promise<JoinRequestResult> {
    await this.assertLeader(groupId, user.id);

    const result = await this.dataSource.transaction(async (manager) => {
      const request = await manager
        .getRepository(JoinRequest)
        .createQueryBuilder('request')
        .setLock('pessimistic_write')
        .where('request.id = :requestId', { requestId })
        .andWhere('request.group_id = :groupId', { groupId })
        .getOne();

      if (!request) {
        throw new NotFoundException('Prośba nie istnieje');
      }

      if (request.status !== JoinRequestStatus.PENDING) {
        throw new ConflictException('Prośba nie jest oczekująca');
      }

      request.status = JoinRequestStatus.REJECTED;
      request.decided_by = user.id;
      request.decided_at = new Date();
      const saved = await manager.save(request);
      const target = await manager.findOne(User, {
        where: { id: saved.user_id },
      });

      return { request: saved, target };
    });

    return {
      request: this.toRequestView(result.request, result.target),
      warnings: [],
    };
  }

  private assertStudent(user: UsosSessionUser): void {
    if (user.role !== UserRole.STUDENT) {
      throw new ForbiddenException(
        'Tylko studenci mogą tworzyć i dołączać do grup',
      );
    }
  }

  private async assertLeader(groupId: string, userId: string): Promise<Group> {
    const group = await this.getGroupOrThrow(groupId);
    const membership = await this.membersRepository.findOne({
      where: { group_id: groupId, user_id: userId },
    });

    if (!membership || membership.role !== MemberRole.LEADER) {
      throw new ForbiddenException(
        'Tylko lider grupy może wykonać tę operację',
      );
    }

    return group;
  }

  private async getGroupOrThrow(groupId: string): Promise<Group> {
    const group = await this.groupsRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Grupa nie istnieje');
    }

    return group;
  }

  private toSummary(
    group: Group,
    leader: Pick<User, 'id' | 'first_name' | 'last_name'>,
    isMember: boolean,
    myRequestStatus: JoinRequestStatus | null,
  ): GroupSummary {
    const freeSlots = Math.max(0, MAX_MEMBERS - group.member_count);

    return {
      id: group.id,
      name: group.name,
      description: group.description,
      leader: {
        id: leader.id,
        firstName: leader.first_name,
        lastName: leader.last_name,
      },
      memberCount: group.member_count,
      maxMembers: MAX_MEMBERS,
      recommendedMembers: RECOMMENDED_MEMBERS,
      freeSlots,
      isFull: group.member_count >= MAX_MEMBERS,
      isLarge: group.member_count >= RECOMMENDED_MEMBERS,
      createdAt: group.created_at,
      isMember,
      myRequestStatus,
    };
  }

  private toRequestView(
    request: JoinRequest,
    user: Pick<
      User,
      'id' | 'first_name' | 'last_name' | 'student_number' | 'email'
    >,
  ): JoinRequestView {
    return {
      id: request.id,
      status: request.status,
      createdAt: request.created_at,
      decidedAt: request.decided_at,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        studentNumber: user.student_number,
        email: user.email,
      },
    };
  }

  private likePattern(value: string): string {
    return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
  }

  private rethrowUnique(error: unknown, message: string): void {
    if (
      error instanceof QueryFailedError &&
      (error as QueryFailedError & { driverError?: { code?: string } })
        .driverError?.code === '23505'
    ) {
      throw new ConflictException(message);
    }
  }
}
