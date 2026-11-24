import { UserRole } from './users.entity';
import { UsersService } from './users.service';

const storedUser = {
  id: 'user-1',
  usos_id: 123,
  first_name: 'Jan',
  last_name: 'Kowalski',
  student_number: 'S123',
  email: 'jan@example.com',
  role: UserRole.STUDENT,
};

function createService() {
  const repository = {
    findOne: jest.fn(),
    create: jest.fn((data: unknown) => data),
    save: jest.fn((data: unknown) => data),
  };

  return { service: new UsersService(repository as never), repository };
}

describe('UsersService', () => {
  it('finds users by id and USOS id', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue(storedUser);

    await expect(service.findById('user-1')).resolves.toEqual(storedUser);
    await expect(service.findByUsosId(123)).resolves.toEqual(storedUser);
    expect(repository.findOne).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-1' },
    });
    expect(repository.findOne).toHaveBeenNthCalledWith(2, {
      where: { usos_id: 123 },
    });
  });

  it('creates a user on first login', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue(null);

    const result = await service.upsertFromUsos({
      usosId: 123,
      firstName: 'Jan',
      lastName: 'Kowalski',
      studentNumber: 'S123',
      email: 'jan@example.com',
      role: UserRole.STUDENT,
    });

    expect(result).toEqual({
      usos_id: 123,
      first_name: 'Jan',
      last_name: 'Kowalski',
      student_number: 'S123',
      email: 'jan@example.com',
      role: UserRole.STUDENT,
    });
    expect(repository.create).toHaveBeenCalledWith(result);
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('updates an existing user on subsequent login', async () => {
    const { service, repository } = createService();
    repository.findOne.mockResolvedValue({ ...storedUser });
    repository.save.mockImplementation(async (data: unknown) => data);

    const result = await service.upsertFromUsos({
      usosId: 123,
      firstName: 'Jan',
      lastName: 'Nowak',
      studentNumber: 'S999',
      email: 'nowy@example.com',
      role: UserRole.STUDENT,
    });

    expect(result.last_name).toBe('Nowak');
    expect(result.student_number).toBe('S999');
    expect(result.email).toBe('nowy@example.com');
    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: storedUser.id, last_name: 'Nowak' }),
    );
  });
});
