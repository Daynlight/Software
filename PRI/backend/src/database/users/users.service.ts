import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './users.entity';

export interface UsosUserData {
  usosId: number;
  firstName: string;
  lastName: string;
  studentNumber: string | null;
  email: string | null;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  findByUsosId(usosId: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { usos_id: usosId } });
  }

  async upsertFromUsos(data: UsosUserData): Promise<User> {
    const existing = await this.findByUsosId(data.usosId);

    if (existing) {
      existing.first_name = data.firstName;
      existing.last_name = data.lastName;
      existing.student_number = data.studentNumber;
      existing.email = data.email;
      existing.role = data.role;
      return this.usersRepository.save(existing);
    }

    const user = this.usersRepository.create({
      usos_id: data.usosId,
      first_name: data.firstName,
      last_name: data.lastName,
      student_number: data.studentNumber,
      email: data.email,
      role: data.role,
    });

    return this.usersRepository.save(user);
  }
}
