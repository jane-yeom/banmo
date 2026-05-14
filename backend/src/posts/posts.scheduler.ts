import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Post, PostStatus, PostCategory } from './post.entity';

@Injectable()
export class PostsScheduler {
  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async autoCloseExpiredPosts() {
    const now = new Date();

    const expiredPosts = await this.postsRepository.find({
      where: {
        status: PostStatus.ACTIVE,
        expiresAt: LessThan(now),
      },
    });

    const expiredEvents = await this.postsRepository.find({
      where: {
        status: PostStatus.ACTIVE,
        category: PostCategory.PROMO_CONCERT,
        eventDateAt: LessThan(now),
      },
    });

    const toClose = [
      ...expiredPosts,
      ...expiredEvents.filter(e => !expiredPosts.some(p => p.id === e.id)),
    ];

    if (toClose.length === 0) return;

    for (const post of toClose) {
      post.status = PostStatus.CLOSED;
      post.closedAt = now;
    }
    await this.postsRepository.save(toClose);
    console.log(`[Scheduler] ${toClose.length}개 공고 자동 마감`);
  }
}
