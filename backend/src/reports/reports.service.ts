import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportReason, ReportStatus, ReportTargetType } from './report.entity';
import { CreateReportDto, UpdateReportStatusDto } from './report.dto';
import { Post } from '../posts/post.entity';
import { TrustService, TrustEvent } from '../users/trust.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private readonly reportsRepository: Repository<Report>,
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly trustService: TrustService,
  ) {}

  async create(reporterId: string, dto: CreateReportDto): Promise<Report> {
    const report = this.reportsRepository.create({ reporterId, ...dto });
    const saved = await this.reportsRepository.save(report);

    // 신고 당한 대상 유저에게 -10점
    const targetUserId = await this.resolveTargetUserId(dto.targetType, dto.targetId);
    if (targetUserId && targetUserId !== reporterId) {
      await this.trustService.applyEvent(targetUserId, TrustEvent.REPORTED).catch(() => {});
    }

    return saved;
  }

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({ order: { createdAt: 'DESC' } });
  }

  async updateStatus(id: string, dto: UpdateReportStatusDto): Promise<Report> {
    const report = await this.reportsRepository.findOne({ where: { id } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');

    const wasResolved =
      report.status !== ReportStatus.RESOLVED && dto.status === ReportStatus.RESOLVED;

    await this.reportsRepository.update(id, { status: dto.status });

    // RESOLVED 전환 시 추가 패널티
    if (wasResolved) {
      const targetUserId = await this.resolveTargetUserId(report.targetType, report.targetId);
      if (targetUserId && report.reason === ReportReason.FRAUD) {
        // 사기 → 추가 -30점 + 자동 밴 검토
        await this.trustService.applyEvent(targetUserId, TrustEvent.FRAUD_RESOLVED).catch(() => {});
      }
    }

    return this.reportsRepository.findOne({ where: { id } }) as Promise<Report>;
  }

  /** 신고 대상 타입/ID → 실제 유저 ID 변환 */
  private async resolveTargetUserId(
    targetType: ReportTargetType,
    targetId: string,
  ): Promise<string | null> {
    if (targetType === ReportTargetType.USER) return targetId;
    if (targetType === ReportTargetType.POST) {
      const post = await this.postsRepository.findOne({ where: { id: targetId } });
      return post?.authorId ?? null;
    }
    return null;
  }
}
