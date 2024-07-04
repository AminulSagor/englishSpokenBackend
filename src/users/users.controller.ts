// src/users/users.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';


export class CreateUserDto {
    username: string;
    email: string;
    password: string;
    otp: string;
  }

  export class VerifyOtpDto {
    email: string;
    otp: string;
  }
  
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('initiate-signup')
  async initiateSignUp(@Body() createUserDto: CreateUserDto): Promise<{ message: string }> {
    const { email } = createUserDto;
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    await this.usersService.initiateSignUp(createUserDto);
    return { message: 'OTP has been sent to your email' };
  }

  @Post('verify-otp')
  async verifyOtpAndCreateUser(@Body() verifyOtpDto: VerifyOtpDto): Promise<User> {
    const { email, otp } = verifyOtpDto;
    return await this.usersService.verifyOtpAndCreateUser(email, otp);
  }
}
