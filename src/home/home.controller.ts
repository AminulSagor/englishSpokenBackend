import { Controller, Get, Query, UseGuards ,Logger} from '@nestjs/common';
import { FilterDto } from './dto/filter.dto';
import { AuthGuard } from '@nestjs/passport';
import { HomeService } from './home.service';



@Controller('home')
export class HomeController {
  private readonly logger = new Logger(HomeController.name);
  constructor(private readonly homeService: HomeService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('active-users')
  async getActiveUsers(@Query() filterDto: FilterDto) {
    this.logger.log('Fetching active users with filters:', filterDto);
    try {
      return await this.homeService.getActiveUsers(filterDto);
    } catch (error) {
      this.logger.error('Failed to fetch active users', error.stack);
      throw error; // Re-throw the error to be handled by global error handlers
    }
  }
}
