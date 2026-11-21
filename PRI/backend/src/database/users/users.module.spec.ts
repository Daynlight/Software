import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './users.entity';
import { UserDBModule } from './users.module';
import { UsersService } from './users.service';

describe('UserDBModule', () => {
  it('compiles and provides UsersService', async () => {
    const mockRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [UserDBModule],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockRepo)
      .compile();

    expect(moduleRef.get(UsersService)).toBeInstanceOf(UsersService);
    await moduleRef.close();
  });
});
