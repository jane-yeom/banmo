import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { NoteGrade } from '../users/user.entity';
import { ReportStatus } from '../reports/report.entity';
import { QnaCategory, QnaStatus } from './qna.entity';
import { BoardType } from '../board/board.entity';
import { PaymentStatus } from '../payments/payment.entity';
import {
  IsEnum, IsOptional, IsString, IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

class BanUserDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

class SetGradeDto {
  @IsEnum(NoteGrade)
  grade: NoteGrade;
}

class ResolveReportDto {
  @IsString()
  action: 'BAN_USER' | 'DELETE_POST' | 'HIDE_POST' | 'WARNING' | 'DISMISS';

  @IsOptional()
  @IsString()
  note?: string;
}

class CreateNoticeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}

class UpdateNoticeDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

class AnswerQnaDto {
  @IsString()
  @IsNotEmpty()
  answer: string;
}

class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  reason: string;
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

  // ─── 대시보드 통계 ────────────────────────────────────────────
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('reports/recent')
  getRecentReports() {
    return this.adminService.getRecentReports(5);
  }

  @Get('qna/recent')
  getRecentQna() {
    return this.adminService.getRecentQna(5);
  }

  // ─── 회원 관리 ───────────────────────────────────────────────
  @Get('users')
  getUsers(
    @Query() { page = 1, limit = 20 }: PaginationQuery,
    @Query('search') search: string = '',
    @Query('grade') grade?: NoteGrade,
    @Query('isBanned') isBannedStr?: string,
  ) {
    const isBanned =
      isBannedStr === 'true' ? true : isBannedStr === 'false' ? false : undefined;
    return this.adminService.getUsers(search, +page, +limit, grade, isBanned);
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @Body() dto: BanUserDto) {
    return this.adminService.banUser(id, dto.reason);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string) {
    return this.adminService.unbanUser(id);
  }

  @Patch('users/:id/grade')
  setGrade(@Param('id') id: string, @Body() dto: SetGradeDto) {
    return this.adminService.setGrade(id, dto.grade);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ─── 공고 관리 ───────────────────────────────────────────────
  @Get('posts')
  getPosts(
    @Query() { page = 1, limit = 20 }: PaginationQuery,
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('isPremium') isPremiumStr?: string,
  ) {
    const isPremium =
      isPremiumStr === 'true' ? true : isPremiumStr === 'false' ? false : undefined;
    return this.adminService.getPosts(+page, +limit, search, category, status, isPremium);
  }

  @Patch('posts/:id/hide')
  hidePost(@Param('id') id: string) {
    return this.adminService.hidePost(id);
  }

  @Patch('posts/:id/show')
  showPost(@Param('id') id: string) {
    return this.adminService.showPost(id);
  }

  @Delete('posts/:id')
  deletePost(@Param('id') id: string) {
    return this.adminService.deletePost(id);
  }

  // ─── 게시판 관리 ──────────────────────────────────────────────
  @Get('boards')
  getBoards(
    @Query() { page = 1, limit = 20 }: PaginationQuery,
    @Query('search') search?: string,
    @Query('type') type?: BoardType,
  ) {
    return this.adminService.getBoards(+page, +limit, search, type);
  }

  @Get('boards/:boardId/comments')
  getBoardComments(@Param('boardId') boardId: string) {
    return this.adminService.getBoardComments(boardId);
  }

  @Delete('boards/:id')
  deleteBoard(@Param('id') id: string) {
    return this.adminService.deleteBoard(id);
  }

  @Delete('boards/:boardId/comments/:commentId')
  deleteBoardComment(
    @Param('boardId') boardId: string,
    @Param('commentId') commentId: string,
  ) {
    return this.adminService.deleteBoardComment(boardId, commentId);
  }

  // ─── 공지사항 관리 ───────────────────────────────────────────
  @Get('notices')
  getNotices(@Query() { page = 1, limit = 20 }: PaginationQuery) {
    return this.adminService.getNotices(+page, +limit);
  }

  @Post('notices')
  createNotice(@Body() dto: CreateNoticeDto, @Request() req: any) {
    return this.adminService.createNotice(dto.title, dto.content, req.user.id);
  }

  @Patch('notices/:id')
  updateNotice(@Param('id') id: string, @Body() dto: UpdateNoticeDto) {
    return this.adminService.updateNotice(id, dto.title, dto.content);
  }

  @Delete('notices/:id')
  deleteNotice(@Param('id') id: string) {
    return this.adminService.deleteNotice(id);
  }

  // ─── 신고 관리 ───────────────────────────────────────────────
  @Get('reports')
  getReports(
    @Query() { page = 1, limit = 20 }: PaginationQuery,
    @Query('status') status?: ReportStatus,
    @Query('targetType') targetType?: string,
  ) {
    return this.adminService.getReports(+page, +limit, status, targetType);
  }

  @Patch('reports/:id/resolve')
  resolveReport(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.adminService.resolveReport(id, dto.action, dto.note);
  }

  // ─── QnA 관리 ────────────────────────────────────────────────
  @Get('qna')
  getQnas(
    @Query() { page = 1, limit = 20 }: PaginationQuery,
    @Query('status') status?: QnaStatus,
    @Query('category') category?: QnaCategory,
  ) {
    return this.adminService.getQnas(+page, +limit, status, category);
  }

  @Get('qna/:id')
  getQnaById(@Param('id') id: string) {
    return this.adminService.getQnaById(id);
  }

  @Patch('qna/:id/answer')
  answerQna(@Param('id') id: string, @Body() dto: AnswerQnaDto) {
    return this.adminService.answerQna(id, dto.answer);
  }

  @Delete('qna/:id')
  deleteQna(@Param('id') id: string) {
    return this.adminService.deleteQna(id);
  }

  // ─── 결제 관리 ───────────────────────────────────────────────
  @Get('payments')
  getPayments(
    @Query() { page = 1, limit = 20 }: PaginationQuery,
    @Query('status') status?: PaymentStatus,
    @Query('type') type?: string,
  ) {
    return this.adminService.getPayments(+page, +limit, status, type);
  }

  @Patch('payments/:id/refund')
  refundPayment(@Param('id') id: string, @Body() dto: RefundPaymentDto) {
    return this.adminService.refundPayment(id, dto.reason);
  }
}
