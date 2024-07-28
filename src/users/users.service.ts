import { Injectable, ConflictException, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserNotConfirmed } from './user-not-confirmed.entity';
import * as bcrypt from 'bcryptjs';
import { OtpService } from 'src/otp/otp.service';
import { CreateUserDto, UpdateUserDetailsDto } from './users.controller';
import { JwtService } from '@nestjs/jwt';
import { TokenBlacklist } from 'src/auth/TokenBlacklist.entity';
import { UserDetails } from './user-details.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserNotConfirmed)
    private usersNotConfirmedRepository: Repository<UserNotConfirmed>,
    @InjectRepository(TokenBlacklist)
    private tokenBlacklistRepository: Repository<TokenBlacklist>,
    @InjectRepository(UserDetails)
    private userDetailsRepository: Repository<UserDetails>,
    private readonly otpService: OtpService,
    private readonly jwtService: JwtService,
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

    const userData = await this.usersNotConfirmedRepository.findOne({ where: { email, otp } });
    if (!userData) {
      throw new BadRequestException('User data not found');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = this.usersRepository.create({ username: userData.username, email, password: hashedPassword });

    try {
      const savedUser = await this.usersRepository.save(newUser);
      await this.usersNotConfirmedRepository.delete(userData.id);
      return savedUser;
    } catch (error) {
      if (error.code === '23505') {
        throw new ConflictException('Username or email already exists');
      } else {
        throw new Error('Failed to create user');
      }
    }
  }

  async resendOtp(email: string): Promise<void> {
    const user = await this.usersNotConfirmedRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newOtp = await this.otpService.generateOtp(email); // This will send the new OTP via email
    user.otp = newOtp;
    await this.usersNotConfirmedRepository.save(user);
  }


  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validatePassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async blacklistToken(token: string): Promise<void> {
    const blacklistedToken = this.tokenBlacklistRepository.create({ token });
    await this.tokenBlacklistRepository.save(blacklistedToken);
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const tokenEntry = await this.tokenBlacklistRepository.findOne({ where: { token } });
    return !!tokenEntry;
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

  async logout(token: string): Promise<void> {
    await this.blacklistToken(token);
  }

  async updateUserProfilePicture(userId: number, file: Express.Multer.File): Promise<string> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userDetails = await this.userDetailsRepository.findOne({ where: { user: { id: userId } } });

    if (!userDetails) {
      throw new NotFoundException('User details not found');
    }

    const filePath = `./uploads/${file.filename}`;
    userDetails.profilePicture = filePath;
    await this.userDetailsRepository.save(userDetails);

    return filePath;
  }

  async updateUserDetails(userId: number, updateUserDetailsDto: UpdateUserDetailsDto): Promise<UserDetails> {
    
    const user = await this.usersRepository.findOne({ where: { id: userId } });


    if (!user) {
      throw new NotFoundException('User not found');
    }

    let userDetails = await this.userDetailsRepository.findOne({ where: { user: { id: userId } } });

    if (!userDetails) {
      userDetails = this.userDetailsRepository.create({ ...updateUserDetailsDto, user });
    } else {
      Object.assign(userDetails, updateUserDetailsDto);
    }

    return this.userDetailsRepository.save(userDetails);
  }

  async getUserDetails(userId: number): Promise<UserDetails> {
    const userDetails = await this.userDetailsRepository.findOne({ where: { user: { id: userId } } });

    if (!userDetails) {
      throw new NotFoundException('User details not found');
    }

    return userDetails;
  }
}
