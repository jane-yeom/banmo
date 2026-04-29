import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Qna, QnaCategory, QnaStatus } from '../admin/qna.entity';
import { User, UserRole } from '../users/user.entity';

@Injectable()
export class QnaService {
  constructor(
    @InjectRepository(Qna)
    private readonly qnaRepo: Repository<Qna>,
  ) {}

  async create(
    data: {
      title: string;
      content: string;
      category: QnaCategory;
      authorName?: string;
      authorEmail?: string;
      isPrivate?: boolean;
    },
    user?: User | null,
  ): Promise<Qna> {
    // 이메일: 명시적 입력 → 유저 이메일 → 빈 문자열 순
    const authorEmail = data.authorEmail || user?.email || '';
    const authorName = user ? (user.nickname ?? data.authorName ?? '') : (data.authorName ?? '');

    const qna = this.qnaRepo.create({
      title: data.title,
      content: data.content,
      category: data.category,
      authorEmail,
      authorName,
      isPrivate: data.isPrivate ?? true,
      authorId: user?.id ?? null,
    } as any);

    const saved = await this.qnaRepo.save(qna) as any;
    return saved;
  }

  async getMyQnas(userId: string): Promise<Qna[]> {
    return this.qnaRepo.find({
      where: { authorId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getById(id: string, user?: User | null): Promise<Qna> {
    const qna = await this.qnaRepo.findOne({ where: { id } });
    if (!qna) throw new NotFoundException('문의를 찾을 수 없습니다.');

    if (user?.role === UserRole.ADMIN) return qna;
    if (qna.authorId && qna.authorId === user?.id) return qna;
    if (!qna.authorId && !qna.isPrivate) return qna;

    throw new ForbiddenException('접근 권한이 없습니다.');
  }
}
