import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FilterDto } from './dto/filter.dto';
import { AuthGuard } from '@nestjs/passport';
import { HomeService } from './home.service';


@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('active-users')
  getActiveUsers(@Query() filterDto: FilterDto) {
    return this.homeService.getActiveUsers(filterDto);
  }
}
