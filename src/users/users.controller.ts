import { Controller, Post, Body, BadRequestException, UseGuards, Req, Put, UseInterceptors, UploadedFile, UsePipes, ValidationPipe, UnauthorizedException, Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './user.entity';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { AuthenticatedRequest } from '../auth/request.interface';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import { UserDetails } from './user-details.entity';


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

export class UpdateUserDetailsDto {
  gender?: string;
  country?: string;
  city?: string;
  institution?: string;
  dateOfBirth?: Date;
  profilePicture?: any; 
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

  @Post('resend-otp')
  async resendOtp(@Body('email') email: string): Promise<{ message: string }> {
    if (!email) {
      throw new BadRequestException('Email is required');
    }
    await this.usersService.resendOtp(email);
    return { message: 'New OTP has been sent to your email' };
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

  @Put('update-details')
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(
  FileInterceptor('profilePicture', {
    fileFilter: (req, file, callback) => {
      if (file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        callback(null, true);
      } else {
        callback(new Error('Invalid file type: Only JPG, JPEG, PNG, and GIF files are allowed.'), false);
      }
    },
    limits: {
      fileSize: 1024 * 1024 * 5, // 5MB
    },
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const extension = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, extension);
        callback(null, `${baseName}-${uniqueSuffix}${extension}`);
      },
    }),
  }),
)
@UsePipes(new ValidationPipe())
async updateProfileAndPicture(
  @UploadedFile() file: Express.Multer.File,
  @Body() updateUserDetailsDto: UpdateUserDetailsDto,
  @Req() req: AuthenticatedRequest
): Promise<{ message: string }> {
  const user = req.user as User;

  if (!user) {
    throw new UnauthorizedException('User not found in request');
  }

  if (updateUserDetailsDto) {
    await this.usersService.updateUserDetails(user.id, updateUserDetailsDto); // Ensure updateUserDetailsDto contains valid data
  }

  let profilePictureUrl = '';
  if (file) {
    const filePath = await this.usersService.updateUserProfilePicture(user.id, file);
    profilePictureUrl = filePath;
  }

  return { message: 'User details updated successfully' };
}


@Get('details')
@UseGuards(AuthGuard('jwt'))
async getUserDetails(@Req() req: AuthenticatedRequest): Promise<{ username: string, email: string, userDetails: UserDetails }> {
  const user = req.user as User;

  if (!user) {
    throw new UnauthorizedException('User not found in request');
  }

  const userDetails = await this.usersService.getUserDetails(user.id);
  return {
    username: user.username,
    email: user.email,
    userDetails
  };
}

}
