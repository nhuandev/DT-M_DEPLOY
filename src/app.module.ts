import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/user/users.module';
import { BlogModule } from './modules/blog/blog.module';
import { CommentModule } from './modules/comment/comment.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SupabaseService } from './modules/supabase/supabase.service';

@Module({
  // Kết nối với mongodb
  imports: [
    MongooseModule.forRoot(process.env.MONGODB?? ""),
    ConfigModule.forRoot({
      isGlobal: true, // Biến môi trường dùng được toàn cục
    }),
    
    UsersModule,
    BlogModule,
    CommentModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public', 'blogs'),
      serveRoot: '/blogs', // Đường dẫn URL để truy cập file tĩnh
    }),
  ],
  controllers: [],
  providers: [SupabaseService],
  exports: [SupabaseService]
})
export class AppModule {}
