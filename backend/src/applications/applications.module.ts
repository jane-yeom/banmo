import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Application } from './application.entity';
import { Post } from '../posts/post.entity';
import { ApplicationsService } from './applications.service';
import { ApplicationsController } from './applications.controller';
import { ChatModule } from '../chat/chat.module';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Application, Post]),
    ChatModule,
    UsersModule,
    NotificationsModule,
  ],
  providers: [ApplicationsService],
  controllers: [ApplicationsController],
})
export class ApplicationsModule {}
