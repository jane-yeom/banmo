import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';
import { Keyword } from './keyword.entity';
import { NotificationSetting } from './notification-setting.entity';
import { FcmService } from './fcm.service';
import { User } from '../users/user.entity';
import { Server } from 'socket.io';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private socketServer: Server | null = null;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Keyword)
    private readonly keywordRepo: Repository<Keyword>,
    @InjectRepository(NotificationSetting)
    private readonly settingRepo: Repository<NotificationSetting>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly fcmService: FcmService,
  ) {}

  /** ChatGateway 에서 Socket.io Server 주입 */
  setSocketServer(server: Server) {
    this.socketServer = server;
  }

  // ─── 설정 ────────────────────────────────────────────────────────
  async getSetting(userId: string): Promise<NotificationSetting> {
    let setting = await this.settingRepo.findOne({ where: { userId } });
    if (!setting) {
      setting = this.settingRepo.create({ userId });
      await this.settingRepo.save(setting);
    }
    return setting;
  }

  async updateSetting(
    userId: string,
    dto: Partial<NotificationSetting>,
  ): Promise<NotificationSetting> {
    const setting = await this.getSetting(userId);
    Object.assign(setting, dto);
    return this.settingRepo.save(setting);
  }

  async saveFcmToken(userId: string, token: string): Promise<void> {
    const setting = await this.getSetting(userId);
    setting.fcmToken = token;
    setting.pushEnabled = true;
    await this.settingRepo.save(setting);
  }

  // ─── 알림 CRUD ──────────────────────────────────────────────────
  async getMyNotifications(userId: string): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> {
    const notifications = await this.notificationRepo.find({
      where: { recipientId: userId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    return { notifications, unreadCount };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const n = await this.notificationRepo.findOne({
      where: { id: notificationId, recipientId: userId },
    });
    if (!n) throw new NotFoundException('알림을 찾을 수 없습니다.');
    n.isRead = true;
    await this.notificationRepo.save(n);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepo.update({ recipientId: userId, isRead: false }, { isRead: true });
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    await this.notificationRepo.delete({ id: notificationId, recipientId: userId });
  }

  // ─── 알림 생성 공통 ─────────────────────────────────────────────
  private isTypeEnabled(setting: NotificationSetting, type: NotificationType): boolean {
    const map: Record<NotificationType, keyof NotificationSetting> = {
      [NotificationType.CHAT_MESSAGE]: 'chatMessage',
      [NotificationType.APPLICATION]: 'application',
      [NotificationType.APPLICATION_STATUS]: 'applicationStatus',
      [NotificationType.KEYWORD]: 'keyword',
      [NotificationType.COMMENT]: 'comment',
      [NotificationType.FAVORITE_POST]: 'favoritePost',
      [NotificationType.SYSTEM]: 'system',
      [NotificationType.NOTICE]: 'notice',
    };
    return setting[map[type]] as boolean;
  }

  async create(dto: {
    recipientId: string;
    senderId?: string;
    type: NotificationType;
    title: string;
    body: string;
    link?: string;
    data?: Record<string, any>;
  }): Promise<Notification | null> {
    try {
      const setting = await this.getSetting(dto.recipientId);
      if (!this.isTypeEnabled(setting, dto.type)) return null;

      const notification = await this.notificationRepo.save(
        this.notificationRepo.create(dto),
      );

      // Socket.io 실시간 전송
      if (this.socketServer) {
        const payload = {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          body: notification.body,
          link: notification.link,
          isRead: false,
          createdAt: notification.createdAt,
          senderId: notification.senderId,
        };
        this.socketServer
          .to(`user:${dto.recipientId}`)
          .emit('notification', payload);
      }

      // FCM 푸시
      if (setting.pushEnabled && setting.fcmToken) {
        const sent = await this.fcmService.sendToDevice(setting.fcmToken, {
          title: dto.title,
          body: dto.body,
          link: dto.link,
        });
        if (!sent) {
          // 만료된 토큰 삭제
          setting.fcmToken = null;
          await this.settingRepo.save(setting);
        }
      }

      return notification;
    } catch (err) {
      this.logger.error('create notification error:', err);
      return null;
    }
  }

  // ─── 도메인별 알림 전송 ─────────────────────────────────────────
  async sendChatNotification(
    senderId: string,
    receiverId: string,
    roomId: string,
    message: string,
  ): Promise<void> {
    const sender = await this.userRepo.findOne({ where: { id: senderId } });
    const nickname = sender?.nickname ?? '누군가';
    await this.create({
      recipientId: receiverId,
      senderId,
      type: NotificationType.CHAT_MESSAGE,
      title: `${nickname}님의 메시지`,
      body: message.length > 30 ? message.slice(0, 30) + '…' : message,
      link: `/chat/${roomId}`,
    });
  }

  async sendApplicationNotification(
    applicantId: string,
    postAuthorId: string,
    postId: string,
  ): Promise<void> {
    const applicant = await this.userRepo.findOne({ where: { id: applicantId } });
    const nickname = applicant?.nickname ?? '누군가';
    await this.create({
      recipientId: postAuthorId,
      senderId: applicantId,
      type: NotificationType.APPLICATION,
      title: '새로운 지원자가 있습니다',
      body: `${nickname}님이 지원했습니다`,
      link: `/mypage`,
      data: { postId },
    });
  }

  async sendApplicationStatusNotification(
    applicantId: string,
    status: 'ACCEPTED' | 'REJECTED',
    postTitle: string,
  ): Promise<void> {
    const isAccepted = status === 'ACCEPTED';
    await this.create({
      recipientId: applicantId,
      type: NotificationType.APPLICATION_STATUS,
      title: isAccepted ? '지원 합격!' : '지원 결과 안내',
      body: `${postTitle} - ${isAccepted ? '합격' : '불합격'}`,
      link: `/mypage`,
    });
  }

  async sendKeywordNotification(
    postId: string,
    postTitle: string,
    content: string,
    authorId: string,
  ): Promise<void> {
    const activeKeywords = await this.keywordRepo.find({ where: { isActive: true } });

    const matched = new Map<string, string>(); // userId → keyword
    for (const kw of activeKeywords) {
      if (kw.userId === authorId) continue; // 본인 공고는 제외
      if (
        postTitle.toLowerCase().includes(kw.keyword.toLowerCase()) ||
        content.toLowerCase().includes(kw.keyword.toLowerCase())
      ) {
        if (!matched.has(kw.userId)) {
          matched.set(kw.userId, kw.keyword);
        }
      }
    }

    await Promise.all(
      [...matched.entries()].map(([userId, keyword]) =>
        this.create({
          recipientId: userId,
          type: NotificationType.KEYWORD,
          title: `키워드 알림: ${keyword}`,
          body: postTitle,
          link: `/jobs/${postId}`,
          data: { postId, keyword },
        }),
      ),
    );
  }

  async sendCommentNotification(
    commentAuthorId: string,
    boardAuthorId: string,
    boardId: string,
  ): Promise<void> {
    if (commentAuthorId === boardAuthorId) return;
    const commenter = await this.userRepo.findOne({ where: { id: commentAuthorId } });
    const nickname = commenter?.nickname ?? '누군가';
    await this.create({
      recipientId: boardAuthorId,
      senderId: commentAuthorId,
      type: NotificationType.COMMENT,
      title: '새 댓글이 달렸습니다',
      body: `${nickname}님이 댓글을 남겼습니다`,
      link: `/board/${boardId}`,
    });
  }

  async sendFavoritePostNotification(
    postId: string,
    postTitle: string,
    userIdToExclude?: string,
  ): Promise<void> {
    // Favorites 모듈에서 직접 repo를 쓰지 않고 서비스를 통해 처리
    // FavoritesService에서 호출할 때 userIds를 넘겨줌
  }

  async sendFavoriteNotificationToUsers(
    userIds: string[],
    postId: string,
    postTitle: string,
  ): Promise<void> {
    await Promise.all(
      userIds.map((userId) =>
        this.create({
          recipientId: userId,
          type: NotificationType.FAVORITE_POST,
          title: '찜한 공고가 업데이트됐습니다',
          body: postTitle,
          link: `/jobs/${postId}`,
          data: { postId },
        }),
      ),
    );
  }
}
