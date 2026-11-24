import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User, UserRole } from '../database/users/users.entity';
import { Group } from '../database/groups/groups.entity';
import {
  GroupMember,
  MemberRole,
} from '../database/groups_members/groups_members.entity';
import {
  JoinRequest,
  JoinRequestStatus,
} from '../database/join_requests/join-requests.entity';
import { databaseEntities } from '../database/data-source';
import { UsosSessionUser } from '../auth/auth.types';
import { clearDatabase } from '../../test/db';
import { GroupsService } from './groups.service';
import {
  GroupWarningCode,
  MAX_MEMBERS,
  RECOMMENDED_MEMBERS,
} from './groups.constants';
import { CreateGroupDto } from './dto/create-group.dto';
import { SearchGroupsQueryDto } from './dto/search-groups.dto';
import { ListJoinRequestsQueryDto } from './dto/list-join-requests.dto';

function testDataSource(): DataSource {
  return new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER ?? process.env.USER,
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_DATABASE ?? 'pri_test',
    entities: databaseEntities,
    synchronize: false,
  });
}

function sessionUser(user: User): UsosSessionUser {
  return {
    id: user.id,
    usos_id: user.usos_id,
    firstName: user.first_name,
    lastName: user.last_name,
    studentNumber: user.student_number,
    email: user.email,
    photoUrl: null,
    role: user.role,
  };
}

describe('GroupsService', () => {
  let dataSource: DataSource;
  let users: Repository<User>;
  let groups: Repository<Group>;
  let members: Repository<GroupMember>;
  let requests: Repository<JoinRequest>;
  let service: GroupsService;

  beforeAll(async () => {
    dataSource = testDataSource();
    await dataSource.initialize();
    users = dataSource.getRepository(User);
    groups = dataSource.getRepository(Group);
    members = dataSource.getRepository(GroupMember);
    requests = dataSource.getRepository(JoinRequest);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
    service = new GroupsService(groups, members, requests, dataSource);
  });

  async function createUser(
    usosId: number,
    role: UserRole = UserRole.STUDENT,
  ): Promise<User> {
    return users.save(
      users.create({
        usos_id: usosId,
        first_name: `Jan${usosId}`,
        last_name: `Kowalski${usosId}`,
        student_number: `S${usosId}`,
        email: `jan${usosId}@example.com`,
        role,
      }),
    );
  }

  async function createGroup(
    leader: User,
    name = 'Zespół A',
    description = 'Opis projektu inżynierskiego',
  ) {
    return service.create(sessionUser(leader), {
      name,
      description,
    } satisfies CreateGroupDto);
  }

  async function addMembers(
    groupId: string,
    count: number,
    startUsosId: number,
  ): Promise<User[]> {
    const created: User[] = [];
    for (let index = 0; index < count; index += 1) {
      const member = await createUser(startUsosId + index);
      await members.save(
        members.create({
          group_id: groupId,
          user_id: member.id,
          role: MemberRole.MEMBER,
        }),
      );
      created.push(member);
    }
    await groups.increment({ id: groupId }, 'member_count', count);
    return created;
  }

  it('creates a group with its leader', async () => {
    const leader = await createUser(1);

    const group = await createGroup(leader);

    expect(group.name).toBe('Zespół A');
    expect(group.memberCount).toBe(1);
    expect(group.leader.id).toBe(leader.id);
    expect(group.isMember).toBe(true);

    const membership = await members.findOne({
      where: { group_id: group.id },
    });
    expect(membership?.role).toBe(MemberRole.LEADER);
  });

  it('rejects group creation by a non-student', async () => {
    const user = await createUser(1, UserRole.OTHER);

    await expect(
      service.create(sessionUser(user), {
        name: 'Zespół',
        description: 'Opis projektu',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejects a second group for the same user', async () => {
    const leader = await createUser(1);
    await createGroup(leader);

    await expect(
      service.create(sessionUser(leader), {
        name: 'Drugi zespół',
        description: 'Kolejny opis projektu',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('prevents two concurrent groups for one user', async () => {
    const leader = await createUser(1);

    const results = await Promise.allSettled([
      service.create(sessionUser(leader), {
        name: 'Zespół A',
        description: 'Opis projektu A',
      }),
      service.create(sessionUser(leader), {
        name: 'Zespół B',
        description: 'Opis projektu B',
      }),
    ]);

    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === 'rejected'),
    ).toHaveLength(1);
  });

  it('maps an unexpected database error while creating a group', async () => {
    const failingDataSource = {
      transaction: jest.fn().mockRejectedValue(new Error('database down')),
    } as unknown as DataSource;
    const failingService = new GroupsService(
      groups,
      members,
      requests,
      failingDataSource,
    );
    const leader = await createUser(1);

    await expect(
      failingService.create(sessionUser(leader), {
        name: 'Zespół',
        description: 'Opis projektu',
      }),
    ).rejects.toThrow('database down');
  });

  describe('search', () => {
    async function seedSearchData() {
      const leaderA = await createUser(1);
      const leaderB = await createUser(2);
      const leaderC = await createUser(3);
      const groupA = await createGroup(leaderA, 'Alpha', 'Aplikacja webowa');
      const groupB = await createGroup(leaderB, 'Beta', 'System mobilny');
      const groupC = await createGroup(leaderC, 'Gamma', 'Projekt badawczy');
      await addMembers(groupA.id, 2, 100);
      await addMembers(groupB.id, 4, 200);
      await addMembers(groupC.id, 5, 300);
      return { leaderA, groupA, groupB, groupC };
    }

    it('returns paginated groups with counts and flags', async () => {
      const { leaderA, groupA } = await seedSearchData();

      const result = await service.search(sessionUser(leaderA), {
        page: 1,
        limit: 2,
        sort: 'name',
        order: 'asc',
      } as SearchGroupsQueryDto);

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe('Alpha');
      expect(result.items[0].memberCount).toBe(3);
      expect(result.items[0].freeSlots).toBe(MAX_MEMBERS - 3);
      expect(result.items[0].isMember).toBe(true);
      expect(result.items[0].myRequestStatus).toBe(JoinRequestStatus.ACCEPTED);
      expect(result.items[0].id).toBe(groupA.id);
    });

    it('filters by name, description and leader', async () => {
      const { leaderA } = await seedSearchData();

      const byName = await service.search(sessionUser(leaderA), {
        search: 'alpha',
        page: 1,
        limit: 20,
        sort: 'createdAt',
        order: 'desc',
      } as SearchGroupsQueryDto);
      const byDescription = await service.search(sessionUser(leaderA), {
        search: 'mobilny',
        page: 1,
        limit: 20,
        sort: 'createdAt',
        order: 'desc',
      } as SearchGroupsQueryDto);
      const byLeader = await service.search(sessionUser(leaderA), {
        leader: 'Kowalski2',
        page: 1,
        limit: 20,
        sort: 'createdAt',
        order: 'desc',
      } as SearchGroupsQueryDto);

      expect(byName.items.map((item) => item.name)).toEqual(['Alpha']);
      expect(byDescription.items.map((item) => item.name)).toEqual(['Beta']);
      expect(byLeader.items.map((item) => item.name)).toEqual(['Beta']);
    });

    it('filters by free slots', async () => {
      const { leaderA } = await seedSearchData();

      const withFreeSlots = await service.search(sessionUser(leaderA), {
        hasFreeSlots: true,
        page: 1,
        limit: 20,
        sort: 'freeSlots',
        order: 'asc',
      } as SearchGroupsQueryDto);
      const withoutFreeSlots = await service.search(sessionUser(leaderA), {
        hasFreeSlots: false,
        page: 1,
        limit: 20,
        sort: 'freeSlots',
        order: 'desc',
      } as SearchGroupsQueryDto);
      const minFreeSlots = await service.search(sessionUser(leaderA), {
        minFreeSlots: 2,
        page: 1,
        limit: 20,
        sort: 'memberCount',
        order: 'asc',
      } as SearchGroupsQueryDto);

      expect(withFreeSlots.items.map((item) => item.name)).toEqual([
        'Beta',
        'Alpha',
      ]);
      expect(withoutFreeSlots.items.map((item) => item.name)).toEqual([
        'Gamma',
      ]);
      expect(minFreeSlots.items.map((item) => item.name)).toEqual(['Alpha']);
    });

    it('filters to the current user groups', async () => {
      const { leaderA } = await seedSearchData();

      const result = await service.search(sessionUser(leaderA), {
        mine: true,
        page: 1,
        limit: 20,
        sort: 'createdAt',
        order: 'desc',
      } as SearchGroupsQueryDto);

      expect(result.total).toBe(1);
      expect(result.items[0].name).toBe('Alpha');
      expect(result.items[0].isMember).toBe(true);
    });

    it('marks a pending request and escapes LIKE wildcards', async () => {
      const { groupB } = await seedSearchData();
      const literalLeader = await createUser(900);
      await createGroup(literalLeader, '100%_test', 'Grupa z wildcardami');
      const applicant = await createUser(901);
      await service.requestToJoin(sessionUser(applicant), groupB.id);

      const result = await service.search(sessionUser(applicant), {
        search: '%_',
        page: 1,
        limit: 20,
        sort: 'createdAt',
        order: 'desc',
      } as SearchGroupsQueryDto);
      const all = await service.search(sessionUser(applicant), {
        page: 1,
        limit: 20,
        sort: 'createdAt',
        order: 'desc',
      } as SearchGroupsQueryDto);
      const beta = all.items.find((item) => item.id === groupB.id);

      expect(result.items.map((item) => item.name)).toEqual(['100%_test']);
      expect(beta?.myRequestStatus).toBe(JoinRequestStatus.PENDING);
    });

    it('returns an empty page when nothing matches', async () => {
      const leader = await createUser(1);

      const result = await service.search(sessionUser(leader), {
        search: 'nie-ma-takiej-grupy',
        page: 1,
        limit: 20,
        sort: 'name',
        order: 'asc',
      } as SearchGroupsQueryDto);

      expect(result).toEqual({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });
  });

  describe('join requests', () => {
    it('creates a pending request with warnings for a large group', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      await addMembers(group.id, RECOMMENDED_MEMBERS - 1, 100);
      const applicant = await createUser(2);

      const result = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );

      expect(result.request.status).toBe(JoinRequestStatus.PENDING);
      expect(result.warnings[0].code).toBe(GroupWarningCode.GROUP_IS_LARGE);
    });

    it('allows a request to a full group with a warning', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      await addMembers(group.id, MAX_MEMBERS - 1, 100);
      const applicant = await createUser(2);

      const result = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );

      expect(result.warnings[0].code).toBe(GroupWarningCode.GROUP_IS_FULL);
      expect(result.request.status).toBe(JoinRequestStatus.PENDING);
    });

    it('rejects duplicate pending requests', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const applicant = await createUser(2);
      await service.requestToJoin(sessionUser(applicant), group.id);

      await expect(
        service.requestToJoin(sessionUser(applicant), group.id),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a request from an existing member', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);

      await expect(
        service.requestToJoin(sessionUser(leader), group.id),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a request for a missing group and by a non-student', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const outsider = await createUser(2, UserRole.OTHER);

      await expect(
        service.requestToJoin(
          sessionUser(leader),
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.requestToJoin(sessionUser(outsider), group.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('maps concurrent duplicate requests to a conflict', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const applicant = await createUser(2);

      const results = await Promise.allSettled([
        service.requestToJoin(sessionUser(applicant), group.id),
        service.requestToJoin(sessionUser(applicant), group.id),
      ]);

      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        results.filter((result) => result.status === 'rejected'),
      ).toHaveLength(1);
    });

    it('propagates unexpected request persistence errors', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const applicant = await createUser(2);
      const failingRequests = {
        findOne: jest.fn().mockResolvedValue(null),
        create: jest.fn((data: unknown) => data),
        save: jest.fn().mockRejectedValue(new Error('database down')),
      } as unknown as Repository<JoinRequest>;
      const failingService = new GroupsService(
        groups,
        members,
        failingRequests,
        dataSource,
      );

      await expect(
        failingService.requestToJoin(sessionUser(applicant), group.id),
      ).rejects.toThrow('database down');
    });

    it('lists requests for the leader with status and pagination', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const first = await createUser(2);
      const second = await createUser(3);
      await service.requestToJoin(sessionUser(first), group.id);
      await service.requestToJoin(sessionUser(second), group.id);

      const pending = await service.listRequests(
        sessionUser(leader),
        group.id,
        {
          status: JoinRequestStatus.PENDING,
          page: 1,
          limit: 1,
        } as ListJoinRequestsQueryDto,
      );
      const all = await service.listRequests(sessionUser(leader), group.id, {
        status: 'ALL',
        page: 1,
        limit: 20,
      } as ListJoinRequestsQueryDto);

      expect(pending.total).toBe(2);
      expect(pending.items).toHaveLength(1);
      expect(pending.totalPages).toBe(2);
      expect(all.items).toHaveLength(2);
    });

    it('returns an empty request page', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);

      const result = await service.listRequests(sessionUser(leader), group.id, {
        status: JoinRequestStatus.PENDING,
        page: 1,
        limit: 20,
      } as ListJoinRequestsQueryDto);

      expect(result).toEqual({
        items: [],
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      });
    });

    it('rejects listing by a non-leader and for a missing group', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const outsider = await createUser(2);

      await expect(
        service.listRequests(sessionUser(outsider), group.id, {
          status: JoinRequestStatus.PENDING,
          page: 1,
          limit: 20,
        } as ListJoinRequestsQueryDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.listRequests(
          sessionUser(leader),
          '00000000-0000-0000-0000-000000000000',
          {
            status: JoinRequestStatus.PENDING,
            page: 1,
            limit: 20,
          } as ListJoinRequestsQueryDto,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('accept and reject', () => {
    it('accepts a request and adds a member', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      await addMembers(group.id, 3, 100);
      const applicant = await createUser(2);
      const { request } = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );

      const result = await service.accept(
        sessionUser(leader),
        group.id,
        request.id,
      );

      expect(result.request.status).toBe(JoinRequestStatus.ACCEPTED);
      expect(result.warnings[0].code).toBe(GroupWarningCode.GROUP_IS_LARGE);
      const membership = await members.findOne({
        where: { group_id: group.id, user_id: applicant.id },
      });
      expect(membership?.role).toBe(MemberRole.MEMBER);
      const storedGroup = await groups.findOne({ where: { id: group.id } });
      expect(storedGroup?.member_count).toBe(5);
    });

    it('cancels the other pending requests after acceptance', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const applicant = await createUser(2);
      const otherLeader = await createUser(3);
      const otherGroup = await createGroup(otherLeader, 'Inna grupa');
      const first = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );
      const second = await service.requestToJoin(
        sessionUser(applicant),
        otherGroup.id,
      );

      await service.accept(sessionUser(leader), group.id, first.request.id);

      const cancelled = await requests.findOne({
        where: { id: second.request.id },
      });
      expect(cancelled?.status).toBe(JoinRequestStatus.CANCELLED);
    });

    it('rejects acceptance when the group is full', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      await addMembers(group.id, MAX_MEMBERS - 1, 100);
      const applicant = await createUser(2);
      const { request } = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );

      await expect(
        service.accept(sessionUser(leader), group.id, request.id),
      ).rejects.toBeInstanceOf(ConflictException);
      const storedGroup = await groups.findOne({ where: { id: group.id } });
      expect(storedGroup?.member_count).toBe(MAX_MEMBERS);
    });

    it('rejects acceptance when the user joined another group', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const otherLeader = await createUser(2);
      const otherGroup = await createGroup(otherLeader, 'Inna grupa');
      const applicant = await createUser(3);
      const { request } = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );
      await members.save(
        members.create({
          group_id: otherGroup.id,
          user_id: applicant.id,
          role: MemberRole.MEMBER,
        }),
      );
      await groups.increment({ id: otherGroup.id }, 'member_count', 1);

      await expect(
        service.accept(sessionUser(leader), group.id, request.id),
      ).rejects.toBeInstanceOf(ConflictException);
      const cancelled = await requests.findOne({ where: { id: request.id } });
      expect(cancelled?.status).toBe(JoinRequestStatus.CANCELLED);
    });

    it('rejects a request that is no longer pending', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const applicant = await createUser(2);
      const { request } = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );
      await requests.update(
        { id: request.id },
        { status: JoinRequestStatus.REJECTED },
      );

      await expect(
        service.accept(sessionUser(leader), group.id, request.id),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects missing requests and non-leaders', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const outsider = await createUser(2);

      await expect(
        service.accept(
          sessionUser(leader),
          group.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.accept(
          sessionUser(outsider),
          group.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('prevents concurrent acceptances from exceeding the limit', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      await addMembers(group.id, MAX_MEMBERS - 2, 100);
      const firstApplicant = await createUser(2);
      const secondApplicant = await createUser(3);
      const first = await service.requestToJoin(
        sessionUser(firstApplicant),
        group.id,
      );
      const second = await service.requestToJoin(
        sessionUser(secondApplicant),
        group.id,
      );

      const results = await Promise.allSettled([
        service.accept(sessionUser(leader), group.id, first.request.id),
        service.accept(sessionUser(leader), group.id, second.request.id),
      ]);

      expect(
        results.filter((result) => result.status === 'fulfilled'),
      ).toHaveLength(1);
      expect(
        results.filter((result) => result.status === 'rejected'),
      ).toHaveLength(1);
      const storedGroup = await groups.findOne({ where: { id: group.id } });
      expect(storedGroup?.member_count).toBe(MAX_MEMBERS);
    });

    it('rejects a request without adding a member', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const applicant = await createUser(2);
      const { request } = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );

      const result = await service.reject(
        sessionUser(leader),
        group.id,
        request.id,
      );

      expect(result.request.status).toBe(JoinRequestStatus.REJECTED);
      expect(
        await members.findOne({
          where: { group_id: group.id, user_id: applicant.id },
        }),
      ).toBeNull();
    });

    it('rejects non-pending, missing, and unauthorized rejections', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const applicant = await createUser(2);
      const outsider = await createUser(3);
      const { request } = await service.requestToJoin(
        sessionUser(applicant),
        group.id,
      );
      await service.reject(sessionUser(leader), group.id, request.id);

      await expect(
        service.reject(sessionUser(leader), group.id, request.id),
      ).rejects.toBeInstanceOf(ConflictException);
      await expect(
        service.reject(
          sessionUser(leader),
          group.id,
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      await expect(
        service.reject(sessionUser(outsider), group.id, request.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

  
  describe('members', () => {
    it('returns the roster to every member', async () => {
      const leader = await createUser(1);
      const group = await createGroup(leader);
      const [member] = await addMembers(group.id, 1, 100);

      const leaderView = await service.members(sessionUser(leader), group.id);
      const memberView = await service.members(sessionUser(member), group.id);

      expect(leaderView).toHaveLength(2);
      expect(leaderView.map((row) => row.role)).toEqual([
        MemberRole.LEADER,
        MemberRole.MEMBER,
      ]);
      expect(leaderView[1].user.id).toBe(member.id);
      expect(leaderView[1].user.studentNumber).toBe('S100');
      expect(memberView.map((row) => row.user.id)).toEqual([
        leader.id,
        member.id,
      ]);
    });

    it('rejects outsiders and missing groups', async () => {
      const leader = await createUser(1);
      const outsider = await createUser(2);
      const group = await createGroup(leader);

      await expect(
        service.members(sessionUser(outsider), group.id),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(
        service.members(
          sessionUser(leader),
          '00000000-0000-0000-0000-000000000000',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update and leave', () => {
      it('updates the group name and description as the leader', async () => {
        const leader = await createUser(1);
        const group = await createGroup(leader);

        const renamed = await service.update(sessionUser(leader), group.id, {
          name: 'Nowa nazwa',
        });
        const described = await service.update(sessionUser(leader), group.id, {
          description: 'Nowy, pełniejszy opis projektu',
        });

        expect(renamed.name).toBe('Nowa nazwa');
        expect(described.description).toBe('Nowy, pełniejszy opis projektu');
        const stored = await groups.findOne({ where: { id: group.id } });
        expect(stored?.name).toBe('Nowa nazwa');
      });

      it('rejects an empty update, a non-leader and a missing group', async () => {
        const leader = await createUser(1);
        const outsider = await createUser(2);
        const group = await createGroup(leader);

        await expect(
          service.update(sessionUser(leader), group.id, {}),
        ).rejects.toBeInstanceOf(BadRequestException);
        await expect(
          service.update(sessionUser(outsider), group.id, { name: 'Nowa' }),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          service.update(
            sessionUser(leader),
            '00000000-0000-0000-0000-000000000000',
            { name: 'Nowa' },
          ),
        ).rejects.toBeInstanceOf(NotFoundException);
      });

      it('lets a member leave without changing the leader', async () => {
        const leader = await createUser(1);
        const group = await createGroup(leader);
        const member = await createUser(2);
        await members.save(
          members.create({
            group_id: group.id,
            user_id: member.id,
            role: MemberRole.MEMBER,
          }),
        );
        await groups.increment({ id: group.id }, 'member_count', 1);

        await service.leave(sessionUser(member), group.id);

        expect(
          await members.findOne({
            where: { group_id: group.id, user_id: member.id },
          }),
        ).toBeNull();
        const stored = await groups.findOne({ where: { id: group.id } });
        expect(stored?.member_count).toBe(1);
        expect(stored?.leader_id).toBe(leader.id);
      });

      it('transfers leadership to a random remaining member', async () => {
        const leader = await createUser(1);
        const group = await createGroup(leader);
        const member = await createUser(2);
        await members.save(
          members.create({
            group_id: group.id,
            user_id: member.id,
            role: MemberRole.MEMBER,
          }),
        );
        await groups.increment({ id: group.id }, 'member_count', 1);

        await service.leave(sessionUser(leader), group.id);

        const stored = await groups.findOne({ where: { id: group.id } });
        expect(stored?.leader_id).toBe(member.id);
        expect(stored?.member_count).toBe(1);
        const promoted = await members.findOne({
          where: { group_id: group.id, user_id: member.id },
        });
        expect(promoted?.role).toBe(MemberRole.LEADER);
        expect(
          await members.findOne({
            where: { group_id: group.id, user_id: leader.id },
          }),
        ).toBeNull();
      });

      it('deletes the group when the last member leaves', async () => {
        const leader = await createUser(1);
        const group = await createGroup(leader);
        const applicant = await createUser(2);
        await service.requestToJoin(sessionUser(applicant), group.id);

        await service.leave(sessionUser(leader), group.id);

        expect(await groups.findOne({ where: { id: group.id } })).toBeNull();
        expect(
          await requests.findOne({ where: { group_id: group.id } }),
        ).toBeNull();
      });

      it('deletes an inconsistent group with no other members', async () => {
        const leader = await createUser(1);
        const group = await createGroup(leader);
        await groups.update({ id: group.id }, { member_count: 2 });

        await service.leave(sessionUser(leader), group.id);

        expect(await groups.findOne({ where: { id: group.id } })).toBeNull();
      });

      it('rejects leaving by a non-member and a missing group', async () => {
        const leader = await createUser(1);
        const outsider = await createUser(2);
        const group = await createGroup(leader);

        await expect(
          service.leave(sessionUser(outsider), group.id),
        ).rejects.toBeInstanceOf(ForbiddenException);
        await expect(
          service.leave(
            sessionUser(leader),
            '00000000-0000-0000-0000-000000000000',
          ),
        ).rejects.toBeInstanceOf(NotFoundException);
      });
    });
  });
});
