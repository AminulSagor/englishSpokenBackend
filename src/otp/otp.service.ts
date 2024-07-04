// src/otp/otp.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

@Injectable()
export class OtpService {
  private otps: Map<string, string> = new Map(); // Store OTPs in memory (consider a more persistent storage in production)

  async generateOtp(email: string): Promise<string> {
    const otp = randomBytes(3).toString('hex'); // Generate a random 6-character OTP
    this.otps.set(email, otp);

    await this.sendOtpEmail(email, otp);
    return otp;
  }

  async validateOtp(email: string, otp: string): Promise<boolean> {
    const storedOtp = this.otps.get(email);
    if (storedOtp === otp) {
      this.otps.delete(email); // Invalidate the OTP after verification
      return true;
    }
    return false;
  }

  private async sendOtpEmail(email: string, otp: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'gardenaid29@gmail.com',
        pass: 'rjwhlucthgnjwmbm', // Use environment variables for security
      },
    });

    const mailOptions = {
      from: 'gardenaid29@gmail.com',
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    };

    await transporter.sendMail(mailOptions);
  }
}
