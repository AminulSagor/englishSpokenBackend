// src/home/home.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeService } from './home.service';
import { HomeGateway } from './home.gateway';
import { AuthSharedModule } from '../auth/auth-shared.module';
import { User } from 'src/users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    AuthSharedModule, 
  ],
  providers: [HomeService, HomeGateway],
})
export class HomeModule {}
