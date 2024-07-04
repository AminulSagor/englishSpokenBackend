import { Injectable } from '@nestjs/common';
import { Repository, LessThan } from 'typeorm'; // Import LessThan from TypeORM
import { InjectRepository } from '@nestjs/typeorm';
import { UserNotConfirmed } from './user-not-confirmed.entity';

@Injectable()
export class CleanupService {
  constructor(
    @InjectRepository(UserNotConfirmed)
    private readonly usersNotConfirmedRepository: Repository<UserNotConfirmed>,
  ) {}

  async handleCron() {
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    // Delete entries older than one hour
    await this.usersNotConfirmedRepository
      .createQueryBuilder()
      .delete()
      .from(UserNotConfirmed)
      .where('createdAt < :createdAt', { createdAt: oneHourAgo })
      .execute();
  }
}
