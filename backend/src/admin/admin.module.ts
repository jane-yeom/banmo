import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { Board } from '../board/board.entity';
import { BoardComment } from '../board/board-comment.entity';
import { Report } from '../reports/report.entity';
import { Qna } from './qna.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Post, Board, BoardComment, Report, Qna]),
    UsersModule,
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [TypeOrmModule],
})
export class AdminModule {}
