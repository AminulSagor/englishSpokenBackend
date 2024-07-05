import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserNotConfirmed } from './user-not-confirmed.entity';
import * as bcrypt from 'bcryptjs';
import { OtpService } from 'src/otp/otp.service';
import { CreateUserDto } from './users.controller';
import { JwtService } from '@nestjs/jwt'; // Make sure to import JwtService

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserNotConfirmed)
    private usersNotConfirmedRepository: Repository<UserNotConfirmed>,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService, // Inject JwtService
  ) {}

  async initiateSignUp(createUserDto: CreateUserDto): Promise<void> {
    const { email, username, password } = createUserDto;
    const user = await this.findByEmail(email);
    if (user) {
      throw new ConflictException('Email already exists');
    }

    const otp = await this.otpService.generateOtp(email);
    await this.usersNotConfirmedRepository.save({ email, username, password, otp });
  }

  async verifyOtpAndCreateUser(email: string, otp: string): Promise<User> {
    const isOtpValid = await this.otpService.validateOtp(email, otp);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Retrieve user data from UserNotConfirmed table
    const userData = await this.usersNotConfirmedRepository.findOne({ where: { email, otp } });
    if (!userData) {
      throw new BadRequestException('User data not found');
    }

    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create a new user entity with hashed password
    const newUser = this.usersRepository.create({ username: userData.username, email, password: hashedPassword });

    try {
      // Attempt to save the new user to the database
      const savedUser = await this.usersRepository.save(newUser);

      // Delete from UserNotConfirmed table after successful signup
      await this.usersNotConfirmedRepository.delete(userData.id);

      return savedUser;
    } catch (error) {
      // Handle any database-specific errors
      if (error.code === '23505') { // Unique constraint violation error code
        throw new ConflictException('Username or email already exists');
      } else {
        throw new Error('Failed to create user');
      }
    }
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.validatePassword(user, password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password not matched');
    }

    const payload = { username: user.username, sub: user.id };
    const accessToken = this.jwtService.sign(payload);

    return { accessToken };
  }
}
