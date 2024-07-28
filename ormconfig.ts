import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { config } from 'dotenv';

config();

const ormConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: true, // Ensure this is false in production
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  ssl: {
    rejectUnauthorized: false,
  },
};

export default ormConfig;
