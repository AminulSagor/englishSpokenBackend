// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { UserNotConfirmed } from './user-not-confirmed.entity'; // Import UserNotConfirmed entity
import { OtpModule } from '../otp/otp.module';
import { CleanupService } from './cleanup.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserNotConfirmed]), // Register User and UserNotConfirmed entities
    OtpModule,
  ],
  controllers: [UsersController],
  providers: [UsersService,CleanupService],
  exports: [UsersService], // If needed for dependency injection
})
export class UsersModule {}
