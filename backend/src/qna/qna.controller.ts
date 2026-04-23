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
import { QnaService } from './qna.service';
import { QnaCategory } from '../admin/qna.entity';
import { IsEmail, IsEnum, IsOptional, IsString, IsBoolean, IsNotEmpty } from 'class-validator';

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

  @IsEmail()
  authorEmail: string;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}

@Controller('qna')
export class QnaController {
  constructor(private readonly qnaService: QnaService) {}

  @Post()
  async create(@Body() dto: CreateQnaDto, @Request() req: any) {
    const user = req.user;
    return this.qnaService.create(dto, user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('my')
  getMyQnas(@Request() req: any) {
    return this.qnaService.getMyQnas(req.user.id);
  }

  @Get(':id')
  async getById(@Param('id') id: string, @Request() req: any) {
    const user = req.user;
    return this.qnaService.getById(id, user);
  }
}
