// src/users/user.entity.ts

import { Entity, PrimaryGeneratedColumn, Column ,BeforeInsert} from 'typeorm';
import * as bcrypt from 'bcryptjs';

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

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10); // Ensure 'this.password' is defined and a string
  }
}
