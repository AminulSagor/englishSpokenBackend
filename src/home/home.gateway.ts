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
import { Logger, BadRequestException } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  pingTimeout: 60000, // 60 seconds
  pingInterval: 25000, // 25 seconds
})
export class HomeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(HomeGateway.name);
  private activeUsers: Map<string, any> = new Map();

  constructor(
    private readonly homeService: HomeService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    console.log('WebSocket server initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    console.log("akhane duke");
    // Log connection details
    this.logger.debug(`Client connection details: ${JSON.stringify(client.handshake)}`);

    // setTimeout(() => {
    //   this.logger.warn(`Disconnecting client due to timeout: ${client.id}`);
    //   client.disconnect();
    // }, 30000);
  }

  async handleDisconnect(client: Socket) {
    console.log("disconnetion happend");
    this.logger.log(`Client disconnected: ${client.id}`);
    this.logger.debug(`Client ${client.id} disconnected at ${new Date().toISOString()}`);
    
    const userData = this.activeUsers.get(client.id);
    if (userData) {
      this.logger.debug(`Removing user from active users list: ${JSON.stringify(userData)}`);
      try {
        await this.usersRepository.update({ id: userData.id }, { active: false });
        this.activeUsers.delete(client.id);
        this.broadcastActiveUsers();
      } catch (error) {
        this.logger.error('Error updating user status on disconnect', error.stack);
      }
    } else {
      this.logger.debug(`No active user found for client ID: ${client.id}`);
    }
  }

  @SubscribeMessage('setActiveUser')
  async handleSetActiveUser(client: Socket, userData: any) {
    this.logger.log(`Received setActiveUser for client: ${client.id}`);
    userData = this.parseData(userData);

    if (!userData || !userData.id) {
      this.logger.warn('Invalid userData received', userData);
      client.emit('error', { message: 'Validation failed: userData and userData.id are required' });
      return;
    }

    try {
      this.logger.debug(`Setting user as active: ${JSON.stringify(userData)}`);
      this.activeUsers.set(client.id, { id: userData.id });
      await this.usersRepository.update({ id: userData.id }, { active: true });
      this.broadcastActiveUsers();
    } catch (error) {
      this.logger.error('Error updating user status on setActiveUser', error.stack);
      client.emit('error', { message: 'Failed to update user status' });
    }
  }

  @SubscribeMessage('getActiveUsers')
  async handleGetActiveUsers(client: Socket, filterDto: FilterDto) {
    this.logger.log(`Received getActiveUsers request from client: ${client.id}`);
    
    // Log the filterDto for debugging purposes
    this.logger.debug(`Filter DTO received: ${JSON.stringify(filterDto)}`);
    
    // Initialize filterDto if null or undefined
    filterDto = filterDto || {};
  
    // Validate each property in filterDto
    filterDto.division = filterDto.division || [];
    filterDto.interest = filterDto.interest || [];
    filterDto.name = filterDto.name || '';

    try {
      this.logger.debug('Fetching active users from the database with filter:', filterDto);
      const activeUsers = await this.homeService.getActiveUsers(filterDto);
      this.logger.debug(`Active users fetched: ${JSON.stringify(activeUsers)}`);
      client.emit('activeUsers', activeUsers);
    } catch (error) {
      this.logger.error('Error fetching active users', error.stack);
      client.emit('error', { message: 'Failed to fetch active users' });
    }
  }

  broadcastActiveUsers() {
    this.logger.log('Broadcasting active users to all clients');
    const activeUsersArray = Array.from(this.activeUsers.values());
    this.logger.debug(`Active users being broadcasted: ${JSON.stringify(activeUsersArray)}`);
    this.server.emit('activeUsers', activeUsersArray);
  }

  private parseData(data: any) {
    if (typeof data === 'string') {
      try {
        this.logger.debug('Attempting to parse string data');
        data = JSON.parse(data);
        this.logger.debug('Parsed data successfully:', data);
      } catch (error) {
        this.logger.error('Failed to parse data string', error.stack);
        return null;
      }
    }
    return data;
  }
}
