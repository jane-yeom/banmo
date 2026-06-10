import { BadRequestException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { IsNull, Repository } from 'typeorm'
import { Review } from './review.entity'
import { UsersService } from '../users/users.service'

export class CreateReviewDto {
  revieweeId: string
  postId?: string
  rating: number
  content?: string
  isPublic?: boolean
}

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    private readonly usersService: UsersService,
  ) {}

  async createReview(reviewerId: string, dto: CreateReviewDto): Promise<Review> {
    if (reviewerId === dto.revieweeId) {
      throw new BadRequestException('자기 자신에게 후기를 남길 수 없습니다')
    }

    const existing = await this.reviewRepo.findOne({
      where: {
        reviewerId,
        revieweeId: dto.revieweeId,
        postId: dto.postId ? dto.postId : IsNull(),
      } as any,
    })
    if (existing) throw new BadRequestException('이미 후기를 작성했습니다')

    const review = this.reviewRepo.create({
      reviewerId,
      revieweeId: dto.revieweeId,
      postId: dto.postId ?? undefined,
      rating: dto.rating,
      content: dto.content ?? undefined,
      isPublic: dto.isPublic ?? true,
    } as Partial<Review> as any)
    const saved = await this.reviewRepo.save(review) as unknown as Review

    // 평점 기반 신뢰점수 반영
    const delta = dto.rating >= 4 ? 3 : dto.rating >= 3 ? 1 : -1
    await this.usersService.addTrustScore(dto.revieweeId, delta, 'review')

    return saved
  }

  async getUserReviews(userId: string): Promise<{ reviews: Review[]; avgRating: number; count: number }> {
    const reviews = await this.reviewRepo.find({
      where: { revieweeId: userId, isPublic: true },
      relations: ['reviewer'],
      order: { createdAt: 'DESC' },
    })
    const count = reviews.length
    const avgRating = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
    return { reviews, avgRating, count }
  }
}
