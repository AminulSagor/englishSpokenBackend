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
  
  @WebSocketGateway()
  export class HomeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
  
    private activeUsers: Map<string, any> = new Map();
  
    constructor(private readonly homeService: HomeService) {}
  
    handleConnection(client: Socket) {
      console.log(`Client connected: ${client.id}`);
    }
  
    handleDisconnect(client: Socket) {
      console.log(`Client disconnected: ${client.id}`);
      this.activeUsers.delete(client.id);
      this.broadcastActiveUsers();
    }
  
    @SubscribeMessage('setActiveUser')
    handleSetActiveUser(client: Socket, userData: any) {
      this.activeUsers.set(client.id, userData);
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
  