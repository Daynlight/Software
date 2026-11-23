import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { GroupDBModule } from './groups.module';
import { GroupsService } from './groups.service';
import { Group } from './groups.entity';
import { GroupMember } from '../groups_members/groups_members.entity';

describe('GroupsModule', () => {
  const mockGroupRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockGroupMemberRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  it('compiles the module and resolves GroupsService with repositories', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GroupDBModule],
    })
      .overrideProvider(getRepositoryToken(Group))
      .useValue(mockGroupRepository)
      .overrideProvider(getRepositoryToken(GroupMember))
      .useValue(mockGroupMemberRepository)
      .compile();

    const service = moduleRef.get<GroupsService>(GroupsService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(GroupsService);
  });

  it('exports GroupsService to importing modules', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [GroupDBModule],
    })
      .overrideProvider(getRepositoryToken(Group))
      .useValue(mockGroupRepository)
      .overrideProvider(getRepositoryToken(GroupMember))
      .useValue(mockGroupMemberRepository)
      .compile();

    const exportedService = moduleRef.get<GroupsService>(GroupsService, {
      strict: false,
    });
    expect(exportedService).toBeDefined();
  });
});
