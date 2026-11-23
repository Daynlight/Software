import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { GroupMember } from '../groups_members/groups_members.entity';

@Entity('groups')
export class Group {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: false })
  name: string;

  @Column({ type: 'uuid', nullable: false })
  owner_id: string;
  
  @Column({ type: 'varchar', nullable: true })
  description: string | null;
  
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, default: null })
  endedAt: Date | null;

  @OneToMany(() => GroupMember, (member) => member.group)
  groupMembers: GroupMember[];
};

