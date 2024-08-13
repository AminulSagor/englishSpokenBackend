import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterDto } from './dto/filter.dto';
import { User } from 'src/users/user.entity';

@Injectable()
export class HomeService {
  private readonly logger = new Logger(HomeService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getActiveUsers(filterDto: FilterDto): Promise<User[]> {
    this.logger.log('Getting active users');

    // Destructure with default values to ensure proper handling
    const { division = [], interest = [], name = '' } = filterDto || {};

    const query = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.userDetails', 'userDetails');

    this.logger.debug(`FilterDto: ${JSON.stringify(filterDto)}`);

    // Filter by division if provided
    if (division.length > 0) {
      query.andWhere('userDetails.division IN (:...divisions)', { divisions: division });
      this.logger.debug(`Filtering by division: ${division}`);
    }

    // Filter by interest if provided
    if (interest.length > 0) {
      query.andWhere('userDetails.interest IN (:...interests)', { interests: interest });
      this.logger.debug(`Filtering by interest: ${interest}`);
    }

    // Filter by name if provided
    if (name) {
      query.andWhere('user.username ILIKE :name', { name: `%${name}%` });
      this.logger.debug(`Filtering by name: ${name}`);
    }

    // Always filter by active status
    query.andWhere('user.active = :active', { active: true });
    this.logger.debug('Filtering by active users');

    try {
      const users = await query.getMany();
      this.logger.log(`Found ${users.length} active users`);
      return users;
    } catch (error) {
      this.logger.error('Error executing query', error.stack);
      throw new Error('Failed to fetch active users');
    }
  }

  filterUsers(users: User[], filterDto: FilterDto): User[] {
    this.logger.debug('Filtering users manually in memory');

    // Destructure with default values to ensure proper handling
    const { division = [], interest = [], name = '' } = filterDto || {};

    return users.filter(user =>
      (division.length === 0 || division.includes(user.userDetails.division)) &&
      (interest.length === 0 || interest.includes(user.userDetails.interest)) &&
      (!name || user.username.toLowerCase().includes(name.toLowerCase())) &&
      user.active
    );
  }
}
