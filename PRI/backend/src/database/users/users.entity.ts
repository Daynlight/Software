import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BeforeInsert, OneToMany } from 'typeorm';
import { GroupMember } from '../groups_members/groups_members.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', unique: true, nullable: false })
  usos_id: number;

  @Column({ type: 'varchar', nullable: false })
  first_name: string;

  @Column({ type: 'varchar', nullable: false })
  last_name: string;
  
  @Column({ type: 'int', nullable: true })
  student_number: number | null;
  
  @Column({ type: 'varchar', nullable: true })
  email: string | null;
  
  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => GroupMember, (member) => member.user)
  groupMembers: GroupMember[];
};

