import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { BadRequestException, Logger } from '@nestjs/common';


@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      this.logger.warn('No token provided, disconnecting client');
      return client.disconnect();
    }
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        this.logger.warn('User not found, disconnecting client');
        return client.disconnect();
      }
      client.data.user = user;
      this.logger.log(`Client connected: ${user.id}`);
    } catch (error) {
      this.logger.error('Token verification failed, disconnecting client:', error.message);
      return client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.data.user?.id}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: any,
  ) {

    // Ensure rawData is an object and parse content and receiverId
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const { content, receiverId } = data;

    if (!content || !receiverId) {
      this.logger.error('Validation failed: content and receiverId are required');
      client.emit('error', { message: 'Validation failed: content and receiverId are required' });
      throw new BadRequestException('Validation failed: content and receiverId are required');
    }

    const senderId = client.data.user.id;

    try {
      const message = await this.chatService.createMessage(senderId, { content, receiverId });
      this.logger.log('Message created:', message);
      this.server.to(receiverId.toString()).emit('receiveMessage', message);
    } catch (error) {
      this.logger.error('Failed to create message:', error.message);
      client.emit('error', { message: 'Failed to create message' });
      throw new BadRequestException('Failed to create message');
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.join(room);
    client.emit('joinedRoom', room);
    this.logger.log(`Client ${client.data.user?.id} joined room ${room}`);

    // Fetch past messages for the room
    try {
      const pastMessages = await this.chatService.getMessagesForRoom(room);

      // Emit the past messages to the client
      client.emit('receiveMessage', pastMessages);
    } catch (error) {
      this.logger.error('Failed to fetch past messages:', error.message);
      client.emit('error', { message: 'Failed to fetch past messages' });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.leave(room);
    client.emit('leftRoom', room);
    this.logger.log(`Client ${client.data.user?.id} left room ${room}`);
  }
}
