// src/home/home.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { HomeService } from './home.service';
import { JwtService } from '@nestjs/jwt';
import { FilterUsersDto } from './dto/filter.dto';

@WebSocketGateway()
export class HomeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly homeService: HomeService,
    private readonly jwtService: JwtService,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      const decoded = this.jwtService.verify(token);
      // Perform any additional logic if needed, like setting the user as active
    } catch (error) {
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      const decoded = this.jwtService.verify(token);
      // Perform any additional logic if needed, like setting the user as inactive
    } catch (error) {
      console.error('Error handling disconnection:', error);
    }
  }

  @SubscribeMessage('getActiveUsers')
  async handleGetActiveUsers(
    @MessageBody() filterUsersDto: FilterUsersDto,
    @ConnectedSocket() client: Socket
  ) {
    const activeUsers = await this.homeService.getFilteredActiveUsers(filterUsersDto);
    client.emit('activeUsers', activeUsers);
  }
}
