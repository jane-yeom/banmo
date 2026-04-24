import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Keyword } from './keyword.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import { User } from '../users/user.entity';

const MAX_KEYWORDS = 10;

@Controller('keywords')
@UseGuards(AuthGuard('jwt'))
export class KeywordsController {
  constructor(
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
  ) {}

  @Get()
  getMyKeywords(@CurrentUser() user: User) {
    return this.keywordRepo.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });
  }

  @Post()
  async addKeyword(@CurrentUser() user: User, @Body() body: { keyword: string }) {
    const keyword = body.keyword?.trim();
    if (!keyword) throw new BadRequestException('키워드를 입력해주세요.');

    const count = await this.keywordRepo.count({ where: { userId: user.id } });
    if (count >= MAX_KEYWORDS) {
      throw new BadRequestException(`키워드는 최대 ${MAX_KEYWORDS}개까지 등록 가능합니다.`);
    }

    const existing = await this.keywordRepo.findOne({
      where: { userId: user.id, keyword },
    });
    if (existing) throw new BadRequestException('이미 등록된 키워드입니다.');

    return this.keywordRepo.save(
      this.keywordRepo.create({ userId: user.id, keyword }),
    );
  }

  @Delete(':id')
  async deleteKeyword(@CurrentUser() user: User, @Param('id') id: string) {
    await this.keywordRepo.delete({ id, userId: user.id });
    return { success: true };
  }

  @Patch(':id/toggle')
  async toggleKeyword(@CurrentUser() user: User, @Param('id') id: string) {
    const kw = await this.keywordRepo.findOne({ where: { id, userId: user.id } });
    if (!kw) throw new BadRequestException('키워드를 찾을 수 없습니다.');
    kw.isActive = !kw.isActive;
    return this.keywordRepo.save(kw);
  }
}
