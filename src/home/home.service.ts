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

  async setUserActive(userId: number): Promise<void> {
    // Update the user's status to active
    await this.userRepository.update({ id: userId }, { active: true });
  }

  async setUserInactive(userId: number): Promise<void> {
    // Update the user's status to inactive
    await this.userRepository.update({ id: userId }, { active: false });
  }

  async getFilteredActiveUsers(filterUsersDto: FilterUsersDto, searchQuery?: string): Promise<User[]> {
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

    if (searchQuery) {
      query.andWhere('user.username LIKE :searchQuery', { searchQuery: `%${searchQuery}%` });
    }

    return await query.getMany();
  }
}
