import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Post, PostStatus } from './post.entity';

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

    if (expiredPosts.length === 0) return;

    for (const post of expiredPosts) {
      post.status = PostStatus.CLOSED;
      post.closedAt = now;
    }
    await this.postsRepository.save(expiredPosts);
    console.log(`[Scheduler] ${expiredPosts.length}개 공고 자동 마감`);
  }
}
