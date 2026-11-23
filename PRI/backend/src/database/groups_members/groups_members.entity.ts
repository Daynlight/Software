import { Entity, Index, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../users/users.entity';
import { Group } from '../groups/groups.entity';

export enum MemberRole {
  LEADER = 'LEADER',
  MEMBER = 'MEMBER',
}

export enum GroupPermission {
  VIEW_GROUP = 'VIEW_GROUP',
  VIEW_MEMBERS = 'VIEW_MEMBERS',
  EDIT_GROUP = 'EDIT_GROUP',
  MANAGE_MEMBERS = 'MANAGE_MEMBERS', 
  TRANSFER_LEADERSHIP = 'TRANSFER_LEADERSHIP',
  END_GROUP = 'END_GROUP',
  LEAVE_GROUP = 'LEAVE_GROUP',
}

export const PERMISSIONS: Record<MemberRole, GroupPermission[]> = {
  [MemberRole.LEADER]: Object.values(GroupPermission),
  [MemberRole.MEMBER]: [
    GroupPermission.VIEW_GROUP,
    GroupPermission.VIEW_MEMBERS,
    GroupPermission.LEAVE_GROUP, 
  ],
};



@Entity('groups_members')
@Index('UQ_groups_members_active', ['group_id', 'user_id'], { unique: true, where: '"leftAt" IS NULL'})
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  group_id: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'varchar', default: 'MEMBER', nullable: false })
  role: MemberRole;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  leftAt: Date | null;
  
  @ManyToOne(() => Group, (group) => group.groupMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id', referencedColumnName: 'id' })
  group: Group;

  @ManyToOne(() => User, (user) => user.groupMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;
}

