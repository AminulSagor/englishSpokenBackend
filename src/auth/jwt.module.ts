import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UserNotConfirmed } from 'src/users/user-not-confirmed.entity';
import { User } from 'src/users/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { OtpService } from 'src/otp/otp.service';
import { JwtStrategy } from './jwt.strategy';
import { UsersController } from 'src/users/users.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserNotConfirmed]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [UsersService, OtpService, JwtStrategy],
  controllers: [UsersController],
})
export class UsersModule {}
