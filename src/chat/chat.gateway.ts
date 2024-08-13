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
import { BadRequestException } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.headers.authorization?.split(' ')[1];
    if (!token) {
      return client.disconnect();
    }
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.usersService.findById(decoded.sub);
      if (!user) {
        return client.disconnect();
      }
      client.data.user = user;
    } catch (error) {
      return client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() rawData: any,
  ) {
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    const { content, receiverId } = data;

    if (!content || !receiverId) {
      client.emit('error', { message: 'Validation failed: content and receiverId are required' });
      throw new BadRequestException('Validation failed: content and receiverId are required');
    }

    const senderId = client.data.user.id;

    try {
      const message = await this.chatService.createMessage(senderId, { content, receiverId });
      this.server.to(receiverId.toString()).emit('receiveMessage', message);
    } catch (error) {
      client.emit('error', { message: 'Failed to create message' });
      throw new BadRequestException('Failed to create message');
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    let parsedData;
    try {
      parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    } catch (error) {
      client.emit('error', { message: 'Invalid data format. Please send a valid JSON object.' });
      return;
    }

    const room = parsedData && parsedData.room ? String(parsedData.room) : undefined;

    if (!room) {
      client.emit('error', { message: 'Room ID is required to join a room' });
      return;
    }

    client.join(room);
    client.emit('joinedRoom', room);

    try {
      const pastMessages = await this.chatService.getMessagesForRoom(room);
      client.emit('receiveMessage', pastMessages);
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch past messages' });
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() room: string, @ConnectedSocket() client: Socket) {
    client.leave(room);
    client.emit('leftRoom', room);
  }
}
