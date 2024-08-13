import { Injectable , Logger} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dtos/create-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
  ) {}

  // Create a message in the specified room
  async createMessage(senderId: number, createMessageDto: CreateMessageDto): Promise<Message> {
    const { receiverId, content } = createMessageDto;
    // Generate a consistent room ID by sorting senderId and receiverId
    const room = [senderId, receiverId].sort().join('-');

    // Create and save the message in the database
    const message = this.messageRepository.create({
      senderId,
      receiverId,
      content,
      room,
    });

    return this.messageRepository.save(message);
  }

  // Retrieve all messages for a specific room, ordered by creation time
  async getMessagesForRoom(room: string): Promise<Message[]> {
    this.logger.log(`Querying messages for room: '${room}'`);
    
    // Fetch the messages from the database
    const messages = await this.messageRepository.find({
      where: { room },
      order: { createdAt: 'ASC' },
    });

    this.logger.log(`Messages found for room '${room}': ${JSON.stringify(messages)}`);
    return messages;
}


  // Get the most recent message for a specific room
  async getLastMessageForRoom(room: string): Promise<Message> {
    return this.messageRepository.findOne({
      where: { room },
      order: { createdAt: 'DESC' },
    });
  }

  // Retrieve the latest conversation for a specific user, grouped by room
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

  // Delete a specific message sent by a specific user
  async deleteMessage(senderId: number, messageId: number): Promise<void> {
    const result = await this.messageRepository.delete({ id: messageId, senderId });
    if (result.affected === 0) {
      throw new Error('Message not found or you do not have permission to delete it.');
    }
  }

  // Delete all messages in a conversation between two users
  async deleteConversation(senderId: number, receiverId: number): Promise<void> {
    const room = [senderId, receiverId].sort().join('-');
    await this.messageRepository.delete({ room });
  }
}
