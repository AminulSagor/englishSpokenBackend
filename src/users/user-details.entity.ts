import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity()
export class UserDetails {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  gender: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  institution: string;

  @Column({ nullable: true })
  dateOfBirth: Date; // Change 'age' to 'dateOfBirth'

  @Column({ nullable: true })
  profilePicture: string;

  @OneToOne(() => User, user => user.userDetails)
  @JoinColumn()
  user: User;
}
