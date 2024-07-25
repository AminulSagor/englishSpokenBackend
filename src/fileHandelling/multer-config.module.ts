import { Module } from '@nestjs/common';
import { MulterConfigService } from './filehandling';

@Module({
  providers: [MulterConfigService],
  exports: [MulterConfigService], // Export the service to be available in other modules
})
export class MulterConfigModule {}
