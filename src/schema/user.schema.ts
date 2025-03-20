import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString, IsNotEmpty } from 'class-validator'; 
import { Types } from 'mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  username: string;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  password: string;

  @Prop({ required: true })
  @IsString()
  @IsNotEmpty()
  email: string;

  @Prop({ default: '' })
  @IsString()
  @IsNotEmpty()
  wallet?: string;

  @Prop({ default: '' })
  @IsString()
  @IsNotEmpty()
  address?: string;

  @Prop({ default: '' })
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @Prop({ default: 0 })
  tokenBalance?: number;

  @Prop()
  @IsString()
  @IsNotEmpty()
  avatar?: string;

  @Prop({
    required: true,
    enum: ['user', 'admin', 'user-silver', 'user-gold', 'user-diamond'],
    default: 'user',
  })
  role: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Course' }] })
  coursesPurchased?: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Material' }] })
  materialsPurchased?: Types.ObjectId[];

  @Prop({ required: true, enum: ['active', 'banned'], default: 'active' })
  status: string;
}
export const UserSchema = SchemaFactory.createForClass(User);
