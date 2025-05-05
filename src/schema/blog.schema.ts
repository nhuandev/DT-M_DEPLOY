import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Blog extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  authorId: Types.ObjectId;

  @Prop()
  category: string;

  @Prop({ type: [String], default: ['#blogstudy'] })
  tags: string[];

  @Prop({ required: true, enum: ['draft', 'published', 'processing', 'block'], default: 'draft' })
  status: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  likes: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Comment' }], default: [] })
  comments: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], default: [] })
  sharedBy: Types.ObjectId[];

  @Prop({ default: 0 })
  views: number;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}
export const BlogSchema = SchemaFactory.createForClass(Blog);
