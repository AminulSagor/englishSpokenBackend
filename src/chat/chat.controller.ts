import {
  Controller,
  Get,
  Delete,
  Param,
  UseGuards,
  Req,
  Body,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { AuthGuard } from '@nestjs/passport';
import { AuthenticatedRequest } from '../auth/request.interface';
import { DeleteConversationDto } from './dtos/delete-conversation.dto';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages/:receiverId')
  async getMessagesForRoom(@Req() req: AuthenticatedRequest, @Param('receiverId') receiverId: number) {
    const senderId = req.user.id;
    const room = [senderId, receiverId].sort().join('-');
    return this.chatService.getMessagesForRoom(room);
  }

  @Get('last-message/:receiverId')
  async getLastMessageForRoom(@Req() req: AuthenticatedRequest, @Param('receiverId') receiverId: number) {
    const senderId = req.user.id;
    const room = [senderId, receiverId].sort().join('-');
    return this.chatService.getLastMessageForRoom(room);
  }

  @Get('conversations')
  async getConversationsForUser(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.chatService.getConversationsForUser(userId);
  }

  @Delete('conversation')
  async deleteConversation(@Req() req: AuthenticatedRequest, @Body() deleteConversationDto: DeleteConversationDto) {
    const senderId = req.user.id;
    await this.chatService.deleteConversation(senderId, deleteConversationDto.receiverId);
    return { message: 'Conversation deleted successfully' };
  }
}
