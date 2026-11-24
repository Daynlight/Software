import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { GroupMember } from '../groups_members/groups_members.entity';
import { JoinRequest } from '../join_requests/join-requests.entity';

export enum UserRole {
  STUDENT = 'STUDENT',
  OTHER = 'OTHER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', unique: true })
  usos_id: number;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  student_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.OTHER })
  role: UserRole;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @OneToMany(() => GroupMember, (member) => member.user)
  memberships: GroupMember[];

  @OneToMany(() => JoinRequest, (request) => request.user)
  join_requests: JoinRequest[];
}
