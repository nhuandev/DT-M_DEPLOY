import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from './modules/user/users.module';

@Module({
  // Kết nối với mongodb
  imports: [
    MongooseModule.forRoot(process.env.MONGODB?? ""),
    ConfigModule.forRoot({
      isGlobal: true, // Biến môi trường dùng được toàn cục
    }),

    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
