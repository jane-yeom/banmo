import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { NoteGrade } from '../users/user.entity';
import { ReportStatus } from '../reports/report.entity';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

class BanUserDto {
  @IsBoolean()
  isBanned: boolean;
}

class SetGradeDto {
  @IsEnum(NoteGrade)
  grade: NoteGrade;
}

class UpdateReportDto {
  @IsEnum(ReportStatus)
  status: ReportStatus;
}

class PaginationQuery {
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

@Controller('admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ─── 통계 ────────────────────────────────────────────────
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('reports/recent')
  getRecentReports() {
    return this.adminService.getRecentReports(5);
  }

  // ─── 회원 관리 ───────────────────────────────────────────
  @Get('users')
  getUsers(
    @Query('search') search: string = '',
    @Query() { page = 1, limit = 20 }: PaginationQuery,
  ) {
    return this.adminService.getUsers(search, +page, +limit);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    return this.adminService.banUser(id, dto.isBanned);
  }

  @Patch('users/:id/grade')
  setGrade(@Param('id') id: string, @Body() dto: SetGradeDto) {
    return this.adminService.setGrade(id, dto.grade);
  }

  // ─── 공고 관리 ───────────────────────────────────────────
  @Get('posts')
  getPosts(@Query() { page = 1, limit = 20 }: PaginationQuery) {
    return this.adminService.getPosts(+page, +limit);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  // ─── 신고 관리 ───────────────────────────────────────────
  @Get('reports')
  getReports(
    @Query() { page = 1, limit = 20 }: PaginationQuery,
    @Query('status') status?: ReportStatus,
  ) {
    return this.adminService.getReports(status, +page, +limit);
  }

  @Patch('reports/:id')
  updateReport(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.adminService.updateReport(id, dto.status);
  }
}
