import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<
    Pick<Repository<User>, 'findOne' | 'create' | 'save'>
  >;

  const sampleUser: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    usos_id: 123456,
    first_name: 'Jan',
    last_name: 'Kowalski',
    student_number: 654321,
    email: 'jan.kowalski@example.edu.pl',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    groupMembers: [],
  };

  beforeEach(async () => {
    repository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('findByUsosID', () => {
    it('returns user when found', async () => {
      repository.findOne.mockResolvedValue(sampleUser);

      const result = await service.findByUsosID(123456);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { usos_id: 123456 },
      });
      expect(result).toEqual(sampleUser);
    });

    it('returns null when user does not exist', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUsosID(999999);

      expect(result).toBeNull();
    });
  });

  describe('findOrCreateUser', () => {
    it('returns existing user without creating a new one', async () => {
      repository.findOne.mockResolvedValue(sampleUser);

      const result = await service.findOrCreateUser(
        123456,
        'Jan',
        'Kowalski',
        654321,
        'jan.kowalski@example.edu.pl',
      );

      expect(result).toEqual(sampleUser);
      expect(repository.create).not.toHaveBeenCalled();
      expect(repository.save).not.toHaveBeenCalled();
    });

    it('creates and saves a new user when none exists', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(sampleUser);
      repository.save.mockResolvedValue(sampleUser);

      const result = await service.findOrCreateUser(
        123456,
        'Jan',
        'Kowalski',
        654321,
        'jan.kowalski@example.edu.pl',
      );

      expect(repository.create).toHaveBeenCalledWith({
        usos_id: 123456,
        first_name: 'Jan',
        last_name: 'Kowalski',
        student_number: 654321,
        email: 'jan.kowalski@example.edu.pl',
      });
      expect(repository.save).toHaveBeenCalledWith(sampleUser);
      expect(result).toEqual(sampleUser);
    });

    it('creates and saves a new user when optional fields are omitted', async () => {
      const minimalUser: User = {
        ...sampleUser,
        student_number: undefined,
        email: undefined,
      };
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(minimalUser);
      repository.save.mockResolvedValue(minimalUser);

      const result = await service.findOrCreateUser(123456, 'Jan', 'Kowalski');

      expect(repository.create).toHaveBeenCalledWith({
        usos_id: 123456,
        first_name: 'Jan',
        last_name: 'Kowalski',
        student_number: undefined,
        email: undefined,
      });
      expect(repository.save).toHaveBeenCalledWith(minimalUser);
      expect(result).toEqual(minimalUser);
    });
  });
});
