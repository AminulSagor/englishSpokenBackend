import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HomeService } from './home.service';
import { FilterDto } from './dto/filter.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/user.entity';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class HomeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(HomeGateway.name);
  private activeUsers: Map<string, any> = new Map();

  constructor(
    private readonly homeService: HomeService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const userData = this.activeUsers.get(client.id);
    if (userData) {
      try {
        await this.usersRepository.update({ id: userData.id }, { active: false });
        this.activeUsers.delete(client.id);
        this.broadcastActiveUsers();
      } catch (error) {
        this.logger.error('Error updating user status on disconnect', error.stack);
      }
    }
  }

  @SubscribeMessage('setActiveUser')
  async handleSetActiveUser(client: Socket, userData: any) {
    try {
      this.logger.log(`Received setActiveUser for client: ${client.id}`);
      userData = this.parseData(userData);

      if (!userData || !userData.id) {
        this.logger.warn('Invalid userData received', userData);
        return;
      }

      this.activeUsers.set(client.id, { id: userData.id });
      await this.usersRepository.update({ id: userData.id }, { active: true });
      this.broadcastActiveUsers();
    } catch (error) {
      this.logger.error('Error updating user status on setActiveUser', error.stack);
    }
  }

  @SubscribeMessage('getActiveUsers')
  handleGetActiveUsers(client: Socket, filterDto: FilterDto) {
    try {
      this.logger.log(`Received getActiveUsers request from client: ${client.id}`);
      filterDto = this.parseData(filterDto);

      const activeUsersArray = Array.from(this.activeUsers.values());
      const filteredUsers = this.homeService.filterUsers(activeUsersArray, filterDto);
      client.emit('activeUsers', filteredUsers);
    } catch (error) {
      this.logger.error('Error fetching active users', error.stack);
    }
  }

  broadcastActiveUsers() {
    this.logger.log('Broadcasting active users to all clients');
    const activeUsersArray = Array.from(this.activeUsers.values());
    this.server.emit('activeUsers', activeUsersArray);
  }

  // Utility function to parse data if it is a string
  private parseData(data: any) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
        this.logger.debug('Parsed data:', data);
      } catch (error) {
        this.logger.error('Failed to parse data string', error.stack);
        return null;
      }
    }
    return data;
  }
}
