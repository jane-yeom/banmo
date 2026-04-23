import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Qna } from '../admin/qna.entity';
import { QnaService } from './qna.service';
import { QnaController } from './qna.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Qna])],
  providers: [QnaService],
  controllers: [QnaController],
})
export class QnaModule {}
