import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByUsosID(usos_id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { usos_id } });
  }

  async findOrCreateUser(usos_id: number): Promise<User> {
    const existing = await this.findByUsosID(usos_id);
    if (existing) {
      return existing;
    }

    const newUser = this.usersRepository.create({ usos_id });
    return this.usersRepository.save(newUser);
  }
}

