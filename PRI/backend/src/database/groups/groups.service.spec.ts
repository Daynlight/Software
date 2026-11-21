import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { Group } from './groups.entity';
import { GroupMember } from '../groups_members/groups_members.entity';

type MockRepository<T extends object> = Partial<Record<keyof Repository<T>, jest.Mock>>;

const createMockRepository = <T extends object>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn((dto) => dto),
  save: jest.fn(),
});

describe('GroupsService', () => {
  let service: GroupsService;
  let groupsRepository: MockRepository<Group>;
  let groupMembersRepository: MockRepository<GroupMember>;

  const groupId = '11111111-1111-1111-1111-111111111111';
  const ownerId = 1001;
  const userId = 2002;

  const baseGroup: Group = {
    id: groupId,
    name: 'Projekt Zespołowy',
    description: 'Opis projektu',
    createdAt: new Date('2026-01-10T10:00:00Z'),
    endedAt: null,
    groupMembers: [],
  };

  beforeEach(async () => {
    groupsRepository = createMockRepository<Group>();
    groupMembersRepository = createMockRepository<GroupMember>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroupsService,
        {
          provide: getRepositoryToken(Group),
          useValue: groupsRepository,
        },
        {
          provide: getRepositoryToken(GroupMember),
          useValue: groupMembersRepository,
        },
      ],
    }).compile();

    service = module.get<GroupsService>(GroupsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findByUUID', () => {
    it('returns group when found', async () => {
      groupsRepository.findOne!.mockResolvedValue(baseGroup);

      const result = await service.findByUUID(groupId);

      expect(result).toEqual(baseGroup);
      expect(groupsRepository.findOne).toHaveBeenCalledWith({ where: { id: groupId } });
    });

    it('returns null when group is not found', async () => {
      groupsRepository.findOne!.mockResolvedValue(null);

      const result = await service.findByUUID(groupId);

      expect(result).toBeNull();
    });
  });

  describe('findByOwnerIDAndName and findAllByOwnerID', () => {
    it('returns null when name is blank', async () => {
      expect(await service.findByOwnerIDAndName(ownerId, '   ')).toBeNull();
      expect(groupsRepository.findOne).not.toHaveBeenCalled();
    });

    it('finds owned group through active owner membership', async () => {
      groupsRepository.findOne!.mockResolvedValue(baseGroup);

      const result = await service.findByOwnerIDAndName(ownerId, 'Projekt Zespołowy');

      expect(result).toEqual(baseGroup);
      expect(groupsRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Projekt Zespołowy',
          groupMembers: {
            user_id: ownerId,
            role: 'owner',
            leftAt: IsNull(),
          },
        },
      });
    });

    it('returns all active owned groups for user_id', async () => {
      groupsRepository.find!.mockResolvedValue([baseGroup]);

      const result = await service.findAllByOwnerID(ownerId);

      expect(result).toEqual([baseGroup]);
      expect(groupsRepository.find).toHaveBeenCalledWith({
        where: {
          groupMembers: {
            user_id: ownerId,
            role: 'owner',
            leftAt: IsNull(),
          },
        },
      });
    });
  });

  describe('findByUserIDAndName and findAllByUserID', () => {
    it('returns null when name is blank', async () => {
      expect(await service.findByUserIDAndName(userId, '  ')).toBeNull();
      expect(groupsRepository.findOne).not.toHaveBeenCalled();
    });

    it('finds group where user is an active member', async () => {
      groupsRepository.findOne!.mockResolvedValue(baseGroup);

      const result = await service.findByUserIDAndName(userId, 'Projekt Zespołowy');

      expect(result).toEqual(baseGroup);
      expect(groupsRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Projekt Zespołowy',
          groupMembers: {
            user_id: userId,
            leftAt: IsNull(),
          },
        },
      });
    });

    it('returns all active groups for user_id', async () => {
      groupsRepository.find!.mockResolvedValue([baseGroup]);

      const result = await service.findAllByUserID(userId);

      expect(result).toEqual([baseGroup]);
      expect(groupsRepository.find).toHaveBeenCalledWith({
        where: {
          groupMembers: {
            user_id: userId,
            leftAt: IsNull(),
          },
        },
      });
    });
  });

  describe('getGroupMembers', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupsRepository.findOne!.mockResolvedValue(null);

      await expect(service.getGroupMembers(groupId)).rejects.toThrow(NotFoundException);
    });

    it('returns active members ordered by joinedAt by default', async () => {
      const joinedAt = new Date('2026-01-10T10:05:00Z');
      groupsRepository.findOne!.mockResolvedValue(baseGroup);
      groupMembersRepository.find!.mockResolvedValue([
        {
          id: 'member-1',
          group_id: groupId,
          user_id: ownerId,
          role: 'owner',
          joinedAt,
          leftAt: null,
        },
      ]);

      const result = await service.getGroupMembers(groupId);

      expect(groupMembersRepository.find).toHaveBeenCalledWith({
        where: { group_id: groupId, leftAt: IsNull() },
        order: { joinedAt: 'ASC' },
      });
      expect(result).toEqual([
        {
          id: 'member-1',
          group_id: groupId,
          user_id: ownerId,
          role: 'owner',
          joinedAt,
          leftAt: null,
        },
      ]);
    });

    it('includes inactive members when includeInactive is true', async () => {
      const joinedAt = new Date('2026-01-10T10:05:00Z');
      const leftAt = new Date('2026-01-15T12:00:00Z');
      groupsRepository.findOne!.mockResolvedValue(baseGroup);
      groupMembersRepository.find!.mockResolvedValue([
        {
          id: 'member-2',
          group_id: groupId,
          user_id: userId,
          role: 'member',
          joinedAt,
          leftAt,
        },
      ]);

      const result = await service.getGroupMembers(groupId, true);

      expect(groupMembersRepository.find).toHaveBeenCalledWith({
        where: { group_id: groupId },
        order: { joinedAt: 'ASC' },
      });
      expect(result[0].leftAt).toEqual(leftAt);
    });
  });

  describe('createGroup', () => {
    it('returns null when owner already has a group with that name', async () => {
      groupsRepository.findOne!.mockResolvedValue(baseGroup);

      const result = await service.createGroup(ownerId, 'Projekt Zespołowy');

      expect(result).toBeNull();
      expect(groupsRepository.save).not.toHaveBeenCalled();
      expect(groupMembersRepository.save).not.toHaveBeenCalled();
    });

    it('creates group and adds owner membership with role owner', async () => {
      groupsRepository.findOne!.mockResolvedValue(null);
      groupsRepository.save!.mockResolvedValue(baseGroup);
      groupMembersRepository.save!.mockResolvedValue({});

      const result = await service.createGroup(ownerId, 'Projekt Zespołowy', 'Opis projektu');

      expect(result).toEqual(baseGroup);
      expect(groupsRepository.create).toHaveBeenCalledWith({
        name: 'Projekt Zespołowy',
        description: 'Opis projektu',
      });
      expect(groupMembersRepository.create).toHaveBeenCalledWith({
        group_id: groupId,
        user_id: ownerId,
        role: 'owner',
        leftAt: null,
      });
      expect(groupMembersRepository.save).toHaveBeenCalledTimes(1);
    });
  });

  describe('endProjectByUUID', () => {
    it('sets endedAt and returns true when project is active', async () => {
      const activeGroup = { ...baseGroup, endedAt: null };
      groupsRepository.findOne!.mockResolvedValue(activeGroup);
      groupsRepository.save!.mockImplementation(async (g) => g as Group);

      const result = await service.endProjectByUUID(groupId);

      expect(result).toBe(true);
      expect(activeGroup.endedAt).toBeInstanceOf(Date);
      expect(groupsRepository.save).toHaveBeenCalledWith(activeGroup);
    });

    it('returns false when group does not exist or endedAt is already set', async () => {
      groupsRepository.findOne!.mockResolvedValueOnce(null);
      expect(await service.endProjectByUUID(groupId)).toBe(false);

      groupsRepository.findOne!.mockResolvedValueOnce({
        ...baseGroup,
        endedAt: new Date('2026-02-01T09:00:00Z'),
      });
      expect(await service.endProjectByUUID(groupId)).toBe(false);
    });
  });

  describe('addUserToGroup', () => {
    it('throws NotFoundException when group does not exist', async () => {
      groupsRepository.findOne!.mockResolvedValue(null);

      await expect(service.addUserToGroup(groupId, userId)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when user is already an active member', async () => {
      groupsRepository.findOne!.mockResolvedValue(baseGroup);
      groupMembersRepository.findOne!.mockResolvedValue({
        id: 'member-1',
        group_id: groupId,
        user_id: userId,
        role: 'member',
        leftAt: null,
      });

      await expect(service.addUserToGroup(groupId, userId)).rejects.toThrow(ConflictException);
    });

    it('creates a new membership record with given or default role', async () => {
      const created = {
        id: 'member-2',
        group_id: groupId,
        user_id: userId,
        role: 'editor',
        joinedAt: new Date(),
        leftAt: null,
      };
      groupsRepository.findOne!.mockResolvedValue(baseGroup);
      groupMembersRepository.findOne!.mockResolvedValue(null);
      groupMembersRepository.save!.mockResolvedValue(created);

      const result = await service.addUserToGroup(groupId, userId, 'editor');

      expect(groupMembersRepository.create).toHaveBeenCalledWith({
        group_id: groupId,
        user_id: userId,
        role: 'editor',
        leftAt: null,
      });
      expect(result).toEqual(created);
    });
  });

  describe('removeUserFromGroup', () => {
    it('sets leftAt on active member', async () => {
      const activeMember: Partial<GroupMember> = {
        id: 'member-1',
        group_id: groupId,
        user_id: userId,
        role: 'member',
        leftAt: null,
      };
      groupMembersRepository.findOne!.mockResolvedValue(activeMember);
      groupMembersRepository.save!.mockImplementation(async (m) => m as GroupMember);

      const result = await service.removeUserFromGroup(groupId, userId);

      expect(result.leftAt).toBeInstanceOf(Date);
      expect(groupMembersRepository.save).toHaveBeenCalledWith(activeMember);
    });

    it('throws NotFoundException when active membership is missing', async () => {
      groupMembersRepository.findOne!.mockResolvedValue(null);

      await expect(service.removeUserFromGroup(groupId, userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignRoleForUserInGroup', () => {
    it('updates role on active member', async () => {
      const activeMember: Partial<GroupMember> = {
        id: 'member-1',
        group_id: groupId,
        user_id: userId,
        role: 'member',
        leftAt: null,
      };
      groupMembersRepository.findOne!.mockResolvedValue(activeMember);
      groupMembersRepository.save!.mockImplementation(async (m) => m as GroupMember);

      const result = await service.assignRoleForUserInGroup(groupId, userId, 'admin');

      expect(result.role).toBe('admin');
      expect(groupMembersRepository.save).toHaveBeenCalledWith(activeMember);
    });

    it('throws NotFoundException when active membership is missing', async () => {
      groupMembersRepository.findOne!.mockResolvedValue(null);

      await expect(
        service.assignRoleForUserInGroup(groupId, userId, 'admin'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('setDescription and setName', () => {
    it('updates description and name when group exists', async () => {
      const group = { ...baseGroup };
      groupsRepository.findOne!.mockResolvedValue(group);
      groupsRepository.save!.mockImplementation(async (g) => g as Group);

      const withNewDesc = await service.setDescription(groupId, 'Zaktualizowany opis');
      expect(withNewDesc.description).toBe('Zaktualizowany opis');

      const withNewName = await service.setName(groupId, 'Nowa Nazwa Projektu');
      expect(withNewName.name).toBe('Nowa Nazwa Projektu');
    });

    it('throws NotFoundException when group does not exist', async () => {
      groupsRepository.findOne!.mockResolvedValue(null);

      await expect(service.setDescription(groupId, null)).rejects.toThrow(NotFoundException);
      await expect(service.setName(groupId, 'Nowa Nazwa')).rejects.toThrow(NotFoundException);
    });
  });
});
