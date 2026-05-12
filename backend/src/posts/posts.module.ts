import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './post.entity';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { PostsScheduler } from './posts.scheduler';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { FavoritesModule } from '../favorites/favorites.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post]),
    UsersModule,
    NotificationsModule,
    FavoritesModule,
  ],
  providers: [PostsService, PostsScheduler],
  controllers: [PostsController],
  exports: [PostsService],
})
export class PostsModule {}
