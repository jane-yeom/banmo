import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from './favorite.entity';
import { Post } from '../posts/post.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepo: Repository<Favorite>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getMyFavorites(userId: string): Promise<Favorite[]> {
    return this.favoriteRepo.find({
      where: { userId },
      relations: ['post', 'post.author'],
      order: { createdAt: 'DESC' },
    });
  }

  async addFavorite(userId: string, postId: string): Promise<Favorite> {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');

    const existing = await this.favoriteRepo.findOne({ where: { userId, postId } });
    if (existing) return existing;

    return this.favoriteRepo.save(
      this.favoriteRepo.create({ userId, postId }),
    );
  }

  async removeFavorite(userId: string, postId: string): Promise<{ success: boolean }> {
    await this.favoriteRepo.delete({ userId, postId });
    return { success: true };
  }

  async checkFavorite(userId: string, postId: string): Promise<{ isFavorite: boolean }> {
    const fav = await this.favoriteRepo.findOne({ where: { userId, postId } });
    return { isFavorite: !!fav };
  }

  /** 공고 업데이트 시 찜한 유저들에게 알림 */
  async notifyFavoriteUsers(postId: string, postTitle: string, excludeUserId?: string): Promise<void> {
    const favs = await this.favoriteRepo.find({ where: { postId } });
    const userIds = favs
      .map((f) => f.userId)
      .filter((id) => id !== excludeUserId);
    if (userIds.length > 0) {
      await this.notificationsService.sendFavoriteNotificationToUsers(userIds, postId, postTitle);
    }
  }
}
