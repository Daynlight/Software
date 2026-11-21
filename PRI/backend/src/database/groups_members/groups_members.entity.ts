import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { User } from '../users/users.entity';
import { Group } from '../groups/groups.entity';

export type MemberRole = 'owner' | 'admin' | 'promotor' | 'member' | string;

@Entity('groups_members')
@Unique(['group_id', 'user_id'])
export class GroupMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', nullable: false })
  group_id: string;

  @Column({ type: 'int', nullable: false })
  user_id: number;

  @Column({ type: 'varchar', default: 'member', nullable: false })
  role: MemberRole;

  @CreateDateColumn()
  joinedAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  leftAt: Date | null;
  
  @ManyToOne(() => Group, (group) => group.groupMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, (user) => user.groupMembers, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'usos_id' })
  user: User;
}

