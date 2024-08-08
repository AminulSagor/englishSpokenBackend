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
      await this.usersRepository.update({ id: userData.id }, { active: false });
      this.activeUsers.delete(client.id);
      this.broadcastActiveUsers();
    }
  }

  @SubscribeMessage('setActiveUser')
  async handleSetActiveUser(client: Socket, userData: any) {
    this.activeUsers.set(client.id, userData);
    await this.usersRepository.update({ id: userData.id }, { active: true });
    this.broadcastActiveUsers();
  }

  @SubscribeMessage('getActiveUsers')
  handleGetActiveUsers(client: Socket, filterDto: FilterDto) {
    const activeUsersArray = Array.from(this.activeUsers.values());
    const filteredUsers = this.homeService.filterUsers(activeUsersArray, filterDto);
    client.emit('activeUsers', filteredUsers);
  }

  broadcastActiveUsers() {
    const activeUsersArray = Array.from(this.activeUsers.values());
    this.server.emit('activeUsers', activeUsersArray);
  }
}
