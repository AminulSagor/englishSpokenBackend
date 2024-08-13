// src/home/home.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { FilterUsersDto } from './dto/filter.dto';
@Injectable()
export class HomeService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getFilteredActiveUsers(filterUsersDto: FilterUsersDto): Promise<User[]> {
    const { division, interest } = filterUsersDto;

    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.userDetails', 'userDetails')
      .where('user.active = :active', { active: true });

    if (division) {
      query.andWhere('userDetails.division = :division', { division });
    }

    if (interest) {
      query.andWhere('userDetails.interest = :interest', { interest });
    }

    return await query.getMany();
  }
}
