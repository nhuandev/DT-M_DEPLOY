import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  InternalServerErrorException,
  NotFoundException,
  Put,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';
import { Response, Request } from 'express';
import { BaseResponse } from 'src/common/base-response';
import { User } from '../../schema/user.schema';
import { JwtService } from '@nestjs/jwt';

@Controller('api/user')
export class UsersController {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  @Post('create')
  async createUser(@Body() userData: User) {
    if (!userData.username || !userData.password || !userData.email) {
      throw new BadRequestException(
        new BaseResponse(400, 'Username, email, and password are required'),
      );
    }

    const existingUserByEmail = await this.usersService.findOne({
      email: userData.email,
    });
    if (existingUserByEmail) {
      throw new BadRequestException(
        new BaseResponse(400, 'Email already exists'),
      );
    }

    const hashedPassword = await bcrypt.hash(userData.password, 12);
    const newUser = await this.usersService.create({
      ...userData,
      password: hashedPassword,
    });

    return new BaseResponse(201, 'User created successfully', newUser);
  }

  @Post('login')
  async login(
    @Body() loginData: { email: string; password: string },
    @Res({ passthrough: true }) response: Response,
  ) {
    const { email, password } = loginData;
    if (!email || !password) {
      throw new BadRequestException(
        new BaseResponse(400, 'Email and password are required'),
      );
    }

    const user = await this.usersService.findOne({ email });
    if (!user) {
      throw new BadRequestException(
        new BaseResponse(400, 'Account does not exist'),
      );
    }

    if (!(await bcrypt.compare(password, user.password))) {
      throw new BadRequestException(
        new BaseResponse(400, 'Email or password incorrect'),
      );
    }

    const jwt = await this.jwtService.signAsync({ id: user.id });
    response.cookie('jwt', jwt, { httpOnly: true });

    return new BaseResponse(201, 'Login successfully', { token: jwt });
  }


  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response) {
    // Clear both JWT and user cookies
    response.clearCookie('jwt');

    return new BaseResponse(200, 'Logged out successfully');
  }

  @Get('list')
  async user(
    @Req() request: Request,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 3,
  ) {
    try {
      const [users, total] = await this.usersService.getUsersWithPagination(
        page,
        limit,
      );

      return {
        data: users,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
      };
    } catch (e) {
      throw new UnauthorizedException();
    }
  }

  @Post('delete')
  async deleteUser(@Body('id') id: string) {
    // console.log('Received ID:', id);
    await this.usersService.delete(id);
    return new BaseResponse(201, 'Xóa tài khoản thành công');
  }

  @Get('detail')
  async detailUser(@Query('id') id: string) {
    try {
      const user = await this.usersService.findById(id);

      const userData = {
        username: user.username,
        password: user.password,
        email: user.email,
        wallet: user.wallet,
        address: user.address,
        phone: user.phone,
        role: user.role,
        status: user.status,
      };
      return new BaseResponse(200, 'Successs', userData);
    } catch (error) {
      new BaseResponse(401, 'Invalid or expired token');
    }
  }

  @Put('update')
  async updateUser(@Query('id') id: string, @Body() updateUserDto: User) {
    if (!id) {
      throw new BadRequestException('Thiếu ID người dùng');
    }
    console.log(id)
    try {
      const updatedUser = await this.usersService.update(id, updateUserDto);
      return new BaseResponse(200, 'Cập nhật thành công', updatedUser);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Không tìm thấy người dùng');
      }
      console.error('Lỗi cập nhật người dùng:', error);
      throw new InternalServerErrorException('Có lỗi xảy ra khi cập nhật người dùng');
    }
  }

  @Get('profile')
  async getProfile(@Req() request: Request) {
    const userId = (request.user as any).id; // Lấy userId từ token trong cookie
    const user = await this.usersService.findOne({ _id: userId });
    if (!user) {
      throw new BadRequestException(new BaseResponse(400, 'User not found'));
    }
    return new BaseResponse(200, 'User profile', {
      id: user.id,
      role: user.role,
      username: user.username,
    });
  }

  @Get('me')
  async getUserInfo(@Req() request: Request) {
    const userId = (request.user as any).id; // Lấy ID từ token qua JwtAuthGuard
    const user = await this.usersService.findOne({ _id: userId });

    if (!user) {
      throw new BadRequestException(new BaseResponse(400, 'User not found'));
    }

    // Loại bỏ các trường không mong muốn
    const {
      password,
      avatar,
      coursesPurchased,
      materialsPurchased,
      ...userInfo
    } = user.toObject();

    return new BaseResponse(
      200,
      'User information retrieved successfully',
      userInfo,
    );
  }
} 
