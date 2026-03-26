import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './application.entity';
import { Post } from '../posts/post.entity';
import { ChatService } from '../chat/chat.service';
import { TrustService, TrustEvent } from '../users/trust.service';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(Application)
    private readonly appRepo: Repository<Application>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly chatService: ChatService,
    private readonly trustService: TrustService,
  ) {}

  async apply(
    applicantId: string,
    postId: string,
    message?: string,
  ): Promise<Application> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    if (post.authorId === applicantId) {
      throw new BadRequestException('본인 공고에는 지원할 수 없습니다.');
    }
    if (post.status !== 'ACTIVE') {
      throw new BadRequestException('모집 중인 공고에만 지원할 수 있습니다.');
    }

    const existing = await this.appRepo.findOne({ where: { postId, applicantId } });
    if (existing) throw new ConflictException('이미 지원한 공고입니다.');

    const application = await this.appRepo.save(
      this.appRepo.create({ postId, applicantId, message }),
    );

    // 공고 작성자와 채팅방 자동 생성
    try {
      await this.chatService.createRoom(applicantId, post.authorId, postId);
    } catch {
      // 채팅방 생성 실패는 지원 자체를 막지 않음
    }

    return application;
  }

  async getMyApplications(applicantId: string): Promise<Application[]> {
    return this.appRepo.find({
      where: { applicantId },
      relations: ['post', 'post.author'],
      order: { createdAt: 'DESC' },
    });
  }

  async getReceivedApplications(authorId: string): Promise<Application[]> {
    return this.appRepo
      .createQueryBuilder('app')
      .innerJoinAndSelect('app.post', 'post')
      .innerJoinAndSelect('app.applicant', 'applicant')
      .where('post.authorId = :authorId', { authorId })
      .orderBy('app.createdAt', 'DESC')
      .getMany();
  }

  async updateStatus(
    userId: string,
    appId: string,
    status: ApplicationStatus,
  ): Promise<Application> {
    const app = await this.appRepo.findOne({
      where: { id: appId },
      relations: ['post'],
    });
    if (!app) throw new NotFoundException('지원 정보를 찾을 수 없습니다.');
    if (app.post.authorId !== userId) throw new ForbiddenException('권한이 없습니다.');

    app.status = status;
    const saved = await this.appRepo.save(app);

    // 합격 처리 시 → 지원자 +5점, 공고 작성자 +5점
    if (status === ApplicationStatus.ACCEPTED) {
      await Promise.all([
        this.trustService.applyEvent(app.applicantId, TrustEvent.DEAL_ACCEPTED).catch(() => {}),
        this.trustService.applyEvent(userId, TrustEvent.DEAL_ACCEPTED).catch(() => {}),
      ]);
    }

    return saved;
  }
}
