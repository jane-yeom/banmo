import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { User, NoteGrade } from '../users/user.entity';
import { Post } from '../posts/post.entity';
import { Report, ReportReason, ReportStatus, ReportTargetType } from '../reports/report.entity';
import { TrustService, TrustEvent } from '../users/trust.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
    @InjectRepository(Report)
    private readonly reportsRepo: Repository<Report>,
    private readonly trustService: TrustService,
  ) {}

  // ─── 회원 관리 ──────────────────────────────────────────────
  async getUsers(search: string, page: number, limit: number) {
    const where = search
      ? [{ nickname: Like(`%${search}%`) }, { email: Like(`%${search}%`) }]
      : {};
    const [items, total] = await this.usersRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async banUser(id: string, isBanned: boolean): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.isBanned = isBanned;
    return this.usersRepo.save(user);
  }

  async setGrade(id: string, grade: NoteGrade): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.noteGrade = grade;
    return this.usersRepo.save(user);
  }

  // ─── 공고 관리 ──────────────────────────────────────────────
  async getPosts(page: number, limit: number) {
    const [items, total] = await this.postsRepo.findAndCount({
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    await this.postsRepo.remove(post);
  }

  // ─── 신고 관리 ──────────────────────────────────────────────
  async getReports(status: ReportStatus | undefined, page: number, limit: number) {
    const where = status ? { status } : {};
    const [items, total] = await this.reportsRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async updateReport(id: string, status: ReportStatus): Promise<Report> {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');

    const wasResolved = report.status !== ReportStatus.RESOLVED && status === ReportStatus.RESOLVED;
    report.status = status;
    const saved = await this.reportsRepo.save(report);

    // RESOLVED 전환 시 대상 유저에게 신뢰 패널티 적용
    if (wasResolved) {
      const targetUserId = await this.resolveTargetUserId(report.targetType, report.targetId);
      if (targetUserId) {
        const event = report.reason === ReportReason.FRAUD
          ? TrustEvent.FRAUD_RESOLVED  // 사기: -30점
          : TrustEvent.REPORTED;       // 일반: -10점
        await this.trustService.applyEvent(targetUserId, event).catch(() => {});
      }
    }

    return saved;
  }

  private async resolveTargetUserId(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string | null> {
    if (targetType === ReportTargetType.USER) return targetId;
    if (targetType === ReportTargetType.POST) {
      const post = await this.postsRepo.findOne({ where: { id: targetId } });
      return post?.authorId ?? null;
    }
    return null;
  }

  // ─── 최근 신고 목록 ──────────────────────────────────────────
  async getRecentReports(limit = 5) {
    return this.reportsRepo.find({
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ─── 통계 ───────────────────────────────────────────────────
  async getStats() {
    const [totalUsers, totalPosts, totalReports, pendingReports] = await Promise.all([
      this.usersRepo.count(),
      this.postsRepo.count(),
      this.reportsRepo.count(),
      this.reportsRepo.count({ where: { status: ReportStatus.PENDING } }),
    ]);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayUsers = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.createdAt >= :start', { start: todayStart })
      .getCount();

    const todayPosts = await this.postsRepo
      .createQueryBuilder('p')
      .where('p.createdAt >= :start', { start: todayStart })
      .getCount();

    return {
      totalUsers,
      totalPosts,
      totalReports,
      pendingReports,
      todayUsers,
      todayPosts,
    };
  }
}
