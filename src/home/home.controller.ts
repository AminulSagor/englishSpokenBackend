import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { FilterDto } from './dto/filter.dto';
import { AuthGuard } from '@nestjs/passport';
import { HomeService } from './home.service';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('active-users')
  async getActiveUsers(@Query() filterDto: FilterDto) {
    try {
      return await this.homeService.getActiveUsers(filterDto);
    } catch (error) {
      console.error('Error fetching active users:', error);
      throw error; // Re-throw the error to be handled by global error handlers
    }
  }
}
