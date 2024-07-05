import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeORM module
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity'; 
import { OtpModule } from './otp/otp.module';
import { UserNotConfirmed } from './users/user-not-confirmed.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres', // Specify the type of database
      host: 'localhost', // Database host
      port: 5432, // Database port
      username: 'postgres', // Database username
      password: 'root', // Database password (change as per your setup)
      database: 'englishSpoken', // Database name
      entities: [User,UserNotConfirmed], // Specify entities (if any)
      synchronize: true, // Automatic schema synchronization (not recommended for production)
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    OtpModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
