import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { OtpModule } from './otp/otp.module';
import { UserNotConfirmed } from './users/user-not-confirmed.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TokenBlacklist } from './auth/TokenBlacklist.entity';
import { BlacklistMiddleware } from './auth/blacklist.middleware';
import { UserDetails } from './users/user-details.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'englishSpoken',
      entities: [User, UserNotConfirmed, TokenBlacklist, UserDetails],
      synchronize: true,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    OtpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BlacklistMiddleware).forRoutes('*');
  }
}
