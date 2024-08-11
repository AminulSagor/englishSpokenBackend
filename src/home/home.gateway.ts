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

@WebSocketGateway()
export class HomeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private activeUsers: Map<string, any> = new Map();

  constructor(
    private readonly homeService: HomeService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const userData = this.activeUsers.get(client.id);
    if (userData) {
      try {
        await this.usersRepository.update({ id: userData.id }, { active: false });
        this.activeUsers.delete(client.id);
        this.broadcastActiveUsers();
      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }
    }
  }

  @SubscribeMessage('setActiveUser')
  async handleSetActiveUser(client: Socket, userData: any) {
    userData = this.parseData(userData);

    if (!userData || !userData.id) {
      console.error('Invalid userData:', userData);
      return;
    }

    this.activeUsers.set(client.id, { id: userData.id });
    try {
      await this.usersRepository.update({ id: userData.id }, { active: true });
      this.broadcastActiveUsers();
    } catch (error) {
      console.error('Error updating user status on set active:', error);
    }
  }

  @SubscribeMessage('getActiveUsers')
  handleGetActiveUsers(client: Socket, filterDto: FilterDto) {
    filterDto = this.parseData(filterDto);

    const activeUsersArray = Array.from(this.activeUsers.values());
    const filteredUsers = this.homeService.filterUsers(activeUsersArray, filterDto);
    client.emit('activeUsers', filteredUsers);
  }

  broadcastActiveUsers() {
    const activeUsersArray = Array.from(this.activeUsers.values());
    this.server.emit('activeUsers', activeUsersArray);
  }

  // Utility function to parse data if it is a string
  private parseData(data: any) {
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
        console.log('Parsed data:', data);
      } catch (error) {
        console.error('Failed to parse data string:', error);
        return null;
      }
    }
    return data;
  }
}
