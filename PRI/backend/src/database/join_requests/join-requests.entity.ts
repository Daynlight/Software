import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Group } from '../groups/groups.entity';
import { User } from '../users/users.entity';

export enum JoinRequestStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

@Entity('join_requests')
@Index('UQ_join_requests_pending', ['user_id', 'group_id'], {
  unique: true,
  where: `"status" = 'PENDING'`,
})
@Index('IDX_join_requests_group_status', ['group_id', 'status'])
@Index('IDX_join_requests_user_status', ['user_id', 'status'])
export class JoinRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({
    type: 'enum',
    enum: JoinRequestStatus,
    default: JoinRequestStatus.PENDING,
  })
  status: JoinRequestStatus;

  @Column({ type: 'uuid', nullable: true })
  decided_by: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  decided_at: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at: Date;

  @ManyToOne(() => Group, (group) => group.join_requests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, (user) => user.join_requests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
