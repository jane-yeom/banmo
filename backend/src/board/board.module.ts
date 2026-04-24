import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './board.entity';
import { BoardComment } from './board-comment.entity';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Board, BoardComment]),
    NotificationsModule,
  ],
  providers: [BoardService],
  controllers: [BoardController],
})
export class BoardModule {}
