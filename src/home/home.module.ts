import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { HomeGateway } from './home.gateway';
import { UserDetails } from 'src/users/user-details.entity';
import { User } from 'src/users/user.entity';


@Module({
  imports: [TypeOrmModule.forFeature([User, UserDetails])],
  controllers: [HomeController],
  providers: [HomeService, HomeGateway],
})
export class HomeModule {}
