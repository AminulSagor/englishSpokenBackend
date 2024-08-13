// src/users/user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { UserDetails } from './user-details.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ default: false })
  active: boolean; 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastActiveAt: Date;

  @OneToOne(() => UserDetails, (userDetails) => userDetails.user, { cascade: true })
  userDetails: UserDetails;

}
