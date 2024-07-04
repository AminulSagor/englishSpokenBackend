// src/otp/otp.module.ts

import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';

@Module({
  providers: [OtpService],
  exports: [OtpService], // Export OtpService
})
export class OtpModule {}
