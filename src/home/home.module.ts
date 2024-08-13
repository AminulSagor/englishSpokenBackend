import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HomeController } from './home.controller';
import { HomeService } from './home.service';
import { UserDetails } from 'src/users/user-details.entity';
import { User } from 'src/users/user.entity';
import { HomeGateway } from './home.gateway';


@Module({
  imports: [TypeOrmModule.forFeature([User, UserDetails])],
  controllers: [HomeController],
  providers: [HomeService, HomeGateway],
})
export class HomeModule {

  constructor() {
    console.log('HomeModule initialized');
  }
}
