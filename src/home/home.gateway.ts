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
      console.log('Client connected:', client.id);

      const token = client.handshake.query.token as string;
      if (!token) {
        console.error('Token is missing. Disconnecting client:', client.id);
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      console.log('Token verified successfully for user:', decoded.userId);

      // Mark the user as active using the decoded userId
      await this.homeService.setUserActive(decoded.userId);
      console.log(`User ${decoded.userId} marked as active`);
    } catch (error) {
      console.error('Error during connection:', error.message);
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    try {
      console.log('Client disconnected:', client.id);

      const token = client.handshake.query.token as string;
      if (token) {
        const decoded = this.jwtService.verify(token);
        
        // Mark the user as inactive using the decoded userId
        await this.homeService.setUserInactive(decoded.userId);
        console.log(`User ${decoded.userId} marked as inactive`);
      } else {
        console.warn('Token missing during disconnection handling:', client.id);
      }
    } catch (error) {
      console.error('Error handling disconnection:', error.message);
    }
  }

  @SubscribeMessage('getActiveUsers')
  async handleGetActiveUsers(
    @MessageBody() filterUsersDto: FilterUsersDto,
    @ConnectedSocket() client: Socket
  ) {
    try {
      console.log('Received request to get active users from client:', client.id);
      const activeUsers = await this.homeService.getFilteredActiveUsers(filterUsersDto);
      client.emit('activeUsers', activeUsers);
      console.log('Active users sent to client:', client.id);
    } catch (error) {
      console.error('Error handling getActiveUsers message:', error.message);
    }
  }
}
