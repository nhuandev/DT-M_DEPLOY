import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator'; // Import từ public.decorator.ts

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector, // Thêm Reflector
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Kiểm tra xem endpoint có được đánh dấu là public không
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu là public, bỏ qua xác thực
    if (isPublic) {
      return true;
    }

    // Logic xác thực JWT hiện tại
    const request = context.switchToHttp().getRequest<Request>();
    const cookie = request.cookies?.['jwt'];

    if (!cookie) {
      throw new UnauthorizedException('JWT token is missing');
    }

    try {
      const data = await this.jwtService.verifyAsync(cookie);
      request.user = data; // Gán thông tin user vào request.user
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired JWT token');
    }
  }
}