import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FilterDto } from './dto/filter.dto';
import { User } from 'src/users/user.entity';

@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getActiveUsers(filterDto: FilterDto): Promise<User[]> {
    const { division, interest, name } = filterDto;
    const query = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.userDetails', 'userDetails');

    if (division && division.length > 0) {
      query.andWhere('user.division IN (:...divisions)', { divisions: division });
    }

    if (interest && interest.length > 0) {
      query.andWhere('userDetails.interest IN (:...interests)', { interests: interest });
    }

    if (name) {
      query.andWhere('user.name ILIKE :name', { name: `%${name}%` });
    }

    query.andWhere('user.active = :active', { active: true });

    return await query.getMany();
  }

  filterUsers(users: any[], filterDto: FilterDto) {
    const { division, interest, name } = filterDto;
    return users.filter(user =>
      (division.length === 0 || division.includes(user.division)) &&
      (interest.length === 0 || interest.includes(user.userDetails.interest)) &&
      (!name || user.name.toLowerCase().includes(name.toLowerCase()))
    );
  }
}
