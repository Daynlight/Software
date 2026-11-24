import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Group } from '../groups/groups.entity';
import { User } from '../users/users.entity';

export enum MemberRole {
  LEADER = 'LEADER',
  MEMBER = 'MEMBER',
}

@Entity('group_members')
@Unique('UQ_group_members_user', ['user_id'])
@Unique('UQ_group_members_group_user', ['group_id', 'user_id'])
@Index('UQ_group_members_leader', ['group_id'], {
  unique: true,
  where: `"role" = 'LEADER'`,
})
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  group_id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'enum', enum: MemberRole })
  role: MemberRole;

  @CreateDateColumn({ type: 'timestamptz' })
  joined_at: Date;

  @ManyToOne(() => Group, (group) => group.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
