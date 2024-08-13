import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { Message } from './entities/message.entity';
import { UsersModule } from '../users/users.module';
import { ChatService } from './chat.service';
import { AuthSharedModule } from 'src/auth/auth-shared.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    UsersModule,
    AuthSharedModule
  ],
  providers: [ChatGateway, ChatService],
  controllers: [ChatController],
})
export class ChatModule {}
