import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { UserNotConfirmed } from './user-not-confirmed.entity';
import { OtpService } from 'src/otp/otp.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from 'src/auth/jwt.strategy';
import { TokenBlacklist } from 'src/auth/TokenBlacklist.entity';
import { UserDetails } from './user-details.entity';
import { MulterConfigModule } from 'src/multer-config.module';
import { MulterConfigService } from 'src/filehandling';


@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserNotConfirmed,TokenBlacklist,UserDetails]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    MulterConfigModule,
  ],
  providers: [UsersService, OtpService, JwtStrategy, MulterConfigService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
