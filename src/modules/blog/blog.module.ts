import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { Blog, BlogSchema } from 'src/schema/blog.schema';
import { UsersController } from '../user/users.controller';
import { BlogService } from './blog.service';
import { BlogController } from './blog.controller';
import { User, UserSchema } from 'src/schema/user.schema';
import { Comment, CommentSchema } from 'src/schema/comment.schema';
import { UsersModule } from '../user/users.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseModule } from '../supabase/supabase.module';
import { SupabaseService } from '../supabase/superbase.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Blog.name,
        schema: BlogSchema,
      },
      { name: 'Comment', schema: CommentSchema },
    ]),

    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    SupabaseModule
  ],
  providers: [BlogService, SupabaseService],
  controllers: [BlogController],
  exports: [BlogService],
})
export class BlogModule {}
