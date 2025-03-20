import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User } from '../../schema/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) { }

  async findOne(data: any) {
    return this.userModel.findOne(data);
  }
  async create(userData: any): Promise<User> {
    const newUser = new this.userModel(userData);
    return newUser.save();
  }

  async findById(id: string) {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new NotFoundException('Invalid user ID');
      }

      const objectId = new Types.ObjectId(id);
      const user = await this.userModel.findById(objectId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return user;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async delete(data: any): Promise<User> {
    const user = this.userModel.findById(data);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user.deleteOne();
  }

  async getUsersWithPagination(page: number, limit: number): Promise<[any[], number]> {
    const skip = (page - 1) * limit;
    const total = await this.userModel.countDocuments();
    const users = await this.userModel
      .find()
      .skip(skip)
      .limit(limit)
      .select('-password');

    return [users, total];
  }

  async update(userId: string, updateData: Partial<User>): Promise<User> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException('ID không hợp lệ');
    }
  
    // Lọc bỏ các trường undefined/null để tránh ghi đè dữ liệu quan trọng
    const filteredUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null)
    );
  
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: filteredUpdateData },
      { new: true, runValidators: true }
    );
  
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
  
    return updatedUser;
  }
  

}
