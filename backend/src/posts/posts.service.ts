import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PayType, PostStatus } from './post.entity';
import { CreatePostDto, PostFilterDto, UpdatePostDto } from './post.dto';
import { TrustService, TrustEvent } from '../users/trust.service';

const MIN_HOURLY_PAY = 10030; // 2024 최저시급

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
    private readonly trustService: TrustService,
  ) {}

  async create(userId: string, dto: CreatePostDto): Promise<Post> {
    this.validatePay(dto.payType, dto.payMin);

    const post = this.postsRepository.create({
      ...dto,
      authorId: userId,
      instruments: dto.instruments ?? [],
      imageUrls: dto.imageUrls ?? [],
    });
    const saved = await this.postsRepository.save(post);

    // 공고 작성 완료 → +2점
    await this.trustService.applyEvent(userId, TrustEvent.POST_CREATED).catch(() => {});

    return saved;
  }

  async findAll(filter: PostFilterDto): Promise<{ items: Post[]; total: number }> {
    const { authorId, category, instrument, region, payMin, payMax, page = 1, limit = 20 } = filter;

    const qb = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author');

    if (authorId) {
      qb.where('post.authorId = :authorId', { authorId });
    } else {
      qb.where('post.status = :status', { status: PostStatus.ACTIVE });
    }

    if (category) qb.andWhere('post.category = :category', { category });
    if (region) qb.andWhere('post.region ILIKE :region', { region: `%${region}%` });
    if (instrument) qb.andWhere('post.instruments ILIKE :instrument', { instrument: `%${instrument}%` });
    if (payMin !== undefined) qb.andWhere('post.payMin >= :payMin', { payMin });
    if (payMax !== undefined) qb.andWhere('post.payMin <= :payMax', { payMax });

    // 프리미엄 먼저, 그 다음 최신순
    qb.orderBy('post.isPremium', 'DESC')
      .addOrderBy('post.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');

    await this.postsRepository.increment({ id }, 'viewCount', 1);
    post.viewCount += 1;
    return post;
  }

  async update(userId: string, id: string, dto: UpdatePostDto): Promise<Post> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    if (post.authorId !== userId) throw new ForbiddenException('수정 권한이 없습니다.');

    const payType = dto.payType ?? post.payType;
    const payMin = dto.payMin ?? post.payMin;
    this.validatePay(payType, payMin);

    Object.assign(post, dto);
    return this.postsRepository.save(post);
  }

  async delete(userId: string, id: string): Promise<void> {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    if (post.authorId !== userId) throw new ForbiddenException('삭제 권한이 없습니다.');
    await this.postsRepository.remove(post);
  }

  private validatePay(payType: PayType, payMin: number): void {
    if (payType === PayType.NEGOTIABLE) return;
    if (payMin <= 0) {
      throw new BadRequestException('협의가 아닌 경우 payMin은 0보다 커야 합니다.');
    }
    if (payType === PayType.HOURLY && payMin < MIN_HOURLY_PAY) {
      throw new BadRequestException(
        `시급은 최저시급(${MIN_HOURLY_PAY.toLocaleString()}원) 이상이어야 합니다.`,
      );
    }
  }
}
