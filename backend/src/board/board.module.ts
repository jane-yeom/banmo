import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Board } from './board.entity';
import { BoardComment } from './board-comment.entity';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Board, BoardComment])],
  providers: [BoardService],
  controllers: [BoardController],
})
export class BoardModule {}
