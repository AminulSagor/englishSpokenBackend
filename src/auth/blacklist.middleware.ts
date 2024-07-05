import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class BlacklistMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async use(req: Request, res: Response, next: Function) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (token) {
      const isBlacklisted = await this.usersService.isTokenBlacklisted(token);
      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been blacklisted');
      }
    }
    next();
  }
}
