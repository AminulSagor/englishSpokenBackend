import { Controller, Post, Body, BadRequestException, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

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

export class LoginDto {
  email: string;
  password: string;
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

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    const { email, password } = loginDto;
    return this.usersService.login(email, password);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request): Promise<{ message: string }> {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new BadRequestException('No token provided');
    }
    await this.usersService.logout(token);
    return { message: 'Logged out successfully' };
  }
}
