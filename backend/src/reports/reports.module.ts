import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from './report.entity';
import { Post } from '../posts/post.entity';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Report, Post]), UsersModule],
  providers: [ReportsService],
  controllers: [ReportsController],
})
export class ReportsModule {}
