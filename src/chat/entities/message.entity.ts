import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  senderId: number;

  @Column()
  receiverId: number;

  @Column()
  room: string;

  @Column()
  content: string;  // Ensure this is correctly defined and not nullable

  @CreateDateColumn()
  createdAt: Date;
}
