import { UsosSessionUser } from '../auth/auth.types';
import { UserRole } from '../database/users/users.entity';
import { GroupsController } from './groups.controller';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { ListJoinRequestsQueryDto } from './dto/list-join-requests.dto';

const user: UsosSessionUser = {
  id: '11111111-1111-1111-1111-111111111111',
  usos_id: 1,
  firstName: 'Jan',
  lastName: 'Kowalski',
  studentNumber: 'S1',
  email: 'jan@example.com',
  photoUrl: null,
  role: UserRole.STUDENT,
};

const createDto: CreateGroupDto = {
  name: 'Zespół A',
  description: 'Opis projektu inżynierskiego',
};

const searchQuery = {
  page: 1,
  limit: 20,
  sort: 'createdAt' as const,
  order: 'desc' as const,
};

const requestQuery: ListJoinRequestsQueryDto = {
  status: 'PENDING' as never,
  page: 1,
  limit: 20,
};

function createController() {
  const service = {
    create: jest.fn().mockResolvedValue({ id: 'group-1' }),
    search: jest.fn().mockResolvedValue({ items: [] }),
    requestToJoin: jest.fn().mockResolvedValue({ request: {} }),
    members: jest.fn().mockResolvedValue([{ id: 'member-1' }]),
    listRequests: jest.fn().mockResolvedValue({ items: [] }),
    accept: jest.fn().mockResolvedValue({ request: {} }),
    reject: jest.fn().mockResolvedValue({ request: {} }),
    update: jest.fn().mockResolvedValue({ id: 'group-1' }),
    leave: jest.fn().mockResolvedValue(undefined),
  };

  return {
    controller: new GroupsController(service as unknown as GroupsService),
    service,
  };
}

describe('GroupsController', () => {
  it('delegates group creation', async () => {
    const { controller, service } = createController();

    await controller.create(user, createDto);

    expect(service.create).toHaveBeenCalledWith(user, createDto);
  });

  it('delegates group search', async () => {
    const { controller, service } = createController();

    await controller.search(user, searchQuery);

    expect(service.search).toHaveBeenCalledWith(user, searchQuery);
  });

  it('delegates joining a group', async () => {
    const { controller, service } = createController();

    await controller.requestToJoin(user, 'group-1');

    expect(service.requestToJoin).toHaveBeenCalledWith(user, 'group-1');
  });

  it('delegates listing members', async () => {
    const { controller, service } = createController();

    await controller.members(user, 'group-1');

    expect(service.members).toHaveBeenCalledWith(user, 'group-1');
  });

  it('delegates listing requests', async () => {
    const { controller, service } = createController();

    await controller.listRequests(user, 'group-1', requestQuery);

    expect(service.listRequests).toHaveBeenCalledWith(
      user,
      'group-1',
      requestQuery,
    );
  });

  it('delegates accepting a request', async () => {
    const { controller, service } = createController();

    await controller.accept(user, 'group-1', 'request-1');

    expect(service.accept).toHaveBeenCalledWith(user, 'group-1', 'request-1');
  });

  it('delegates updating and leaving a group', async () => {
    const { controller, service } = createController();

    await controller.update(user, 'group-1', { name: 'Nowa nazwa' });
    await controller.leave(user, 'group-1');

    expect(service.update).toHaveBeenCalledWith(user, 'group-1', {
      name: 'Nowa nazwa',
    });
    expect(service.leave).toHaveBeenCalledWith(user, 'group-1');
  });

  it('delegates rejecting a request', async () => {
    const { controller, service } = createController();

    await controller.reject(user, 'group-1', 'request-1');

    expect(service.reject).toHaveBeenCalledWith(user, 'group-1', 'request-1');
  });
});
