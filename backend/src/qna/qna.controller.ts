import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OptionalJwtGuard } from '../auth/optional-jwt.guard';
import { QnaService } from './qna.service';
import { QnaCategory } from '../admin/qna.entity';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';

class CreateQnaDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(QnaCategory)
  category: QnaCategory;

  @IsOptional()
  @IsString()
  authorName?: string;

  // 비로그인 시 이메일 입력, 로그인 시 선택
  @IsOptional()
  @IsEmail()
  authorEmail?: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  // 로그인/비로그인 모두 허용 (OptionalJwtGuard)
  @UseGuards(OptionalJwtGuard)
  @Post()
  async create(@Body() dto: CreateQnaDto, @Request() req: any) {
    const user = req.user ?? null;
    console.log('[QnA] 문의 접수:', dto.category, dto.title, user ? `user:${user.id}` : '비로그인');
    const result = await this.qnaService.create(dto, user);
    return { success: true, data: result };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  async getMyQnas(@Request() req: any) {
    const qnas = await this.qnaService.getMyQnas(req.user.id);
    return { success: true, data: qnas };
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Request() req: any) {
    const user = req.user ?? null;
    const qna = await this.qnaService.getById(id, user);
    return { success: true, data: qna };
  }
}
