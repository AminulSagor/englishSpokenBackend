import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dtos/create-message.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  async createMessage(senderId: number, createMessageDto: CreateMessageDto): Promise<Message> {
    const { receiverId, content } = createMessageDto;
    const room = [senderId, receiverId].sort().join('-');

    const message = this.messageRepository.create({
      senderId,
      receiverId,
      content,
      room,
    });

    return this.messageRepository.save(message);
  }

  async getMessagesForRoom(room: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { room },
      order: { createdAt: 'ASC' },
    });
  }

  async getLastMessageForRoom(room: string): Promise<Message> {
    return this.messageRepository.findOne({
      where: { room },
      order: { createdAt: 'DESC' },
    });
  }

  async getConversationsForUser(userId: number): Promise<{ receiverId: number; lastMessage: Message }[]> {
    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .select('DISTINCT ON (message.room) message.room')
      .addSelect('message.*')
      .where('message.senderId = :userId OR message.receiverId = :userId', { userId })
      .orderBy('message.room')
      .addOrderBy('message.createdAt', 'DESC')
      .getRawMany();

    return messages.map((message) => ({
      receiverId: message.senderId === userId ? message.receiverId : message.senderId,
      lastMessage: message,
    }));
  }

  async deleteMessage(senderId: number, messageId: number): Promise<void> {
    const result = await this.messageRepository.delete({ id: messageId, senderId });
    if (result.affected === 0) {
      throw new Error('Message not found or you do not have permission to delete it.');
    }
  }

  async deleteConversation(senderId: number, receiverId: number): Promise<void> {
    const room = [senderId, receiverId].sort().join('-');
    await this.messageRepository.delete({ room });
  }
}
