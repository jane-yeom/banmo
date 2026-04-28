import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { User, NoteGrade } from '../users/user.entity';
import { Post, PostStatus } from '../posts/post.entity';
import { Board, BoardType } from '../board/board.entity';
import { BoardComment } from '../board/board-comment.entity';
import { Report, ReportStatus, ReportTargetType } from '../reports/report.entity';
import { Qna, QnaCategory, QnaStatus } from './qna.entity';
import { Payment, PaymentStatus } from '../payments/payment.entity';
import { TrustService, TrustEvent } from '../users/trust.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Post)
    private readonly postsRepo: Repository<Post>,
    @InjectRepository(Board)
    private readonly boardsRepo: Repository<Board>,
    @InjectRepository(BoardComment)
    private readonly commentsRepo: Repository<BoardComment>,
    @InjectRepository(Report)
    private readonly reportsRepo: Repository<Report>,
    @InjectRepository(Qna)
    private readonly qnaRepo: Repository<Qna>,
    @InjectRepository(Payment)
    private readonly paymentsRepo: Repository<Payment>,
    private readonly trustService: TrustService,
  ) {}

  // ─── 통계 ───────────────────────────────────────────────────
  async getStats() {
    console.log('[Admin] getStats 호출');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      bannedUsers,
      totalPosts,
      activePosts,
      hiddenPosts,
      totalBoards,
      totalReports,
      pendingReports,
      totalQna,
      pendingQna,
      totalPayments,
    ] = await Promise.all([
      this.usersRepo.count({ where: { deletedAt: IsNull() } }),
      this.usersRepo.count({ where: { isBanned: true, deletedAt: IsNull() } }),
      this.postsRepo.count(),
      this.postsRepo.count({ where: { status: PostStatus.ACTIVE } }),
      this.postsRepo.count({ where: { status: PostStatus.HIDDEN } }),
      this.boardsRepo.count(),
      this.reportsRepo.count(),
      this.reportsRepo.count({ where: { status: ReportStatus.PENDING } }),
      this.qnaRepo.count(),
      this.qnaRepo.count({ where: { status: QnaStatus.PENDING } }),
      this.paymentsRepo.count({ where: { status: PaymentStatus.SUCCESS } }),
    ]);

    const todayUsers = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.createdAt >= :start', { start: todayStart })
      .andWhere('u.deletedAt IS NULL')
      .getCount();

    const todayPosts = await this.postsRepo
      .createQueryBuilder('p')
      .where('p.createdAt >= :start', { start: todayStart })
      .getCount();

    const thisMonthPayments = await this.paymentsRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: PaymentStatus.SUCCESS })
      .andWhere('p.paidAt >= :start', { start: monthStart })
      .getMany();

    const thisMonthAmount = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    const allPayments = await this.paymentsRepo.find({ where: { status: PaymentStatus.SUCCESS } });
    const totalAmount = allPayments.reduce((sum, p) => sum + p.amount, 0);

    return {
      users: {
        total: totalUsers,
        today: todayUsers,
        thisMonth: await this.usersRepo
          .createQueryBuilder('u')
          .where('u.createdAt >= :start', { start: monthStart })
          .andWhere('u.deletedAt IS NULL')
          .getCount(),
        banned: bannedUsers,
      },
      posts: {
        total: totalPosts,
        today: todayPosts,
        active: activePosts,
        hidden: hiddenPosts,
      },
      boards: {
        total: totalBoards,
        today: await this.boardsRepo
          .createQueryBuilder('b')
          .where('b.createdAt >= :start', { start: todayStart })
          .getCount(),
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
      },
      qna: {
        total: totalQna,
        pending: pendingQna,
      },
      payments: {
        total: totalPayments,
        totalAmount,
        thisMonth: thisMonthAmount,
      },
    };
  }

  async getRecentReports(limit = 5) {
    console.log('[Admin] getRecentReports 호출, limit:', limit);
    return this.reportsRepo.find({
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getRecentQna(limit = 5) {
    console.log('[Admin] getRecentQna 호출, limit:', limit);
    return this.qnaRepo.find({
      where: { status: QnaStatus.PENDING },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ─── 회원 관리 ──────────────────────────────────────────────
  async getUsers(
    search: string,
    page: number,
    limit: number,
    grade?: NoteGrade,
    isBanned?: boolean,
  ) {
    console.log('[Admin] getUsers 호출 - search:', search, 'page:', page, 'limit:', limit);
    const qb = this.usersRepo
      .createQueryBuilder('u')
      .where('u.deletedAt IS NULL');

    if (search) {
      qb.andWhere('(u.nickname ILIKE :s OR u.email ILIKE :s)', { s: `%${search}%` });
    }
    if (grade) {
      qb.andWhere('u.noteGrade = :grade', { grade });
    }
    if (isBanned !== undefined) {
      qb.andWhere('u.isBanned = :isBanned', { isBanned });
    }

    qb.orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [users, total] = await qb.getManyAndCount();

    const data = await Promise.all(
      users.map(async (u) => {
        const postCount = await this.postsRepo.count({ where: { authorId: u.id } });
        return { ...u, postCount };
      }),
    );

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    console.log('[Admin] getUserById 호출 - id:', id);
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const posts = await this.postsRepo.find({
      where: { authorId: id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const reports = await this.reportsRepo.find({
      where: { targetId: id, targetType: ReportTargetType.USER },
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
    });

    const payments = await this.paymentsRepo.find({
      where: { userId: id },
      relations: ['post'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return { user, posts, reports, payments };
  }

  async banUser(id: string, reason?: string): Promise<User> {
    console.log('[Admin] banUser 호출 - id:', id, 'reason:', reason);
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.isBanned = true;
    if (reason) user.banReason = reason;
    return this.usersRepo.save(user);
  }

  async unbanUser(id: string): Promise<User> {
    console.log('[Admin] unbanUser 호출 - id:', id);
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.isBanned = false;
    (user as any).banReason = null;
    return this.usersRepo.save(user);
  }

  async setGrade(id: string, grade: NoteGrade): Promise<User> {
    console.log('[Admin] setGrade 호출 - id:', id, 'grade:', grade);
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.noteGrade = grade;
    return this.usersRepo.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    console.log('[Admin] deleteUser 호출 - id:', id);
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.deletedAt = new Date();
    await this.usersRepo.save(user);
    // 해당 유저 공고 전부 HIDDEN 처리
    await this.postsRepo.update({ authorId: id }, { status: PostStatus.HIDDEN });
  }

  // ─── 공고 관리 ──────────────────────────────────────────────
  async getPosts(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    status?: string,
    isPremium?: boolean,
  ) {
    console.log('[Admin] getPosts 호출 - page:', page, 'limit:', limit, 'search:', search);
    const qb = this.postsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.author', 'author');

    if (search) {
      qb.andWhere('p.title ILIKE :s', { s: `%${search}%` });
    }
    if (category) {
      qb.andWhere('p.category = :category', { category });
    }
    if (status) {
      qb.andWhere('p.status = :status', { status });
    }
    if (isPremium !== undefined) {
      qb.andWhere('p.isPremium = :isPremium', { isPremium });
    }

    qb.orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await qb.getManyAndCount();
    return { data: posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async hidePost(id: string): Promise<Post> {
    console.log('[Admin] hidePost 호출 - id:', id);
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    post.status = PostStatus.HIDDEN;
    return this.postsRepo.save(post);
  }

  async showPost(id: string): Promise<Post> {
    console.log('[Admin] showPost 호출 - id:', id);
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    post.status = PostStatus.ACTIVE;
    return this.postsRepo.save(post);
  }

  async deletePost(id: string): Promise<void> {
    console.log('[Admin] deletePost 호출 - id:', id);
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    await this.postsRepo.remove(post);
  }

  // ─── 게시판 관리 ──────────────────────────────────────────────
  async getBoards(
    page: number,
    limit: number,
    search?: string,
    type?: BoardType,
  ) {
    console.log('[Admin] getBoards 호출 - page:', page, 'limit:', limit, 'type:', type);
    const qb = this.boardsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.author', 'author')
      .where('b.type != :noticeType', { noticeType: BoardType.NOTICE });

    if (search) {
      qb.andWhere('b.title ILIKE :s', { s: `%${search}%` });
    }
    if (type) {
      qb.andWhere('b.type = :type', { type });
    }

    qb.orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [boards, total] = await qb.getManyAndCount();

    const data = await Promise.all(
      boards.map(async (b) => {
        const commentCount = await this.commentsRepo.count({ where: { boardId: b.id } });
        return { ...b, commentCount };
      }),
    );

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getBoardComments(boardId: string) {
    console.log('[Admin] getBoardComments 호출 - boardId:', boardId);
    return this.commentsRepo.find({
      where: { boardId },
      relations: ['author'],
      order: { createdAt: 'ASC' },
    });
  }

  async deleteBoard(id: string): Promise<void> {
    console.log('[Admin] deleteBoard 호출 - id:', id);
    const board = await this.boardsRepo.findOne({ where: { id } });
    if (!board) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    await this.commentsRepo.delete({ boardId: id });
    await this.boardsRepo.remove(board);
  }

  async deleteBoardComment(boardId: string, commentId: string): Promise<void> {
    console.log('[Admin] deleteBoardComment 호출 - boardId:', boardId, 'commentId:', commentId);
    const comment = await this.commentsRepo.findOne({
      where: { id: commentId, boardId },
    });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    await this.commentsRepo.remove(comment);
  }

  // ─── 공지사항 관리 ──────────────────────────────────────────────
  async getNotices(page: number, limit: number) {
    console.log('[Admin] getNotices 호출 - page:', page, 'limit:', limit);
    const [notices, total] = await this.boardsRepo.findAndCount({
      where: { type: BoardType.NOTICE },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data: notices, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createNotice(title: string, content: string, adminId: string): Promise<Board> {
    console.log('[Admin] createNotice 호출 - title:', title);
    const board = this.boardsRepo.create({
      type: BoardType.NOTICE,
      title,
      content,
      authorId: adminId,
    });
    return this.boardsRepo.save(board);
  }

  async updateNotice(id: string, title?: string, content?: string): Promise<Board> {
    console.log('[Admin] updateNotice 호출 - id:', id);
    const board = await this.boardsRepo.findOne({ where: { id, type: BoardType.NOTICE } });
    if (!board) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    if (title !== undefined) board.title = title;
    if (content !== undefined) board.content = content;
    return this.boardsRepo.save(board);
  }

  async deleteNotice(id: string): Promise<void> {
    console.log('[Admin] deleteNotice 호출 - id:', id);
    const board = await this.boardsRepo.findOne({ where: { id, type: BoardType.NOTICE } });
    if (!board) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    await this.boardsRepo.remove(board);
  }

  // ─── 신고 관리 ──────────────────────────────────────────────
  async getReports(
    page: number,
    limit: number,
    status?: ReportStatus,
    targetType?: string,
  ) {
    console.log('[Admin] getReports 호출 - page:', page, 'status:', status, 'targetType:', targetType);
    const qb = this.reportsRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reporter', 'reporter');

    if (status) qb.andWhere('r.status = :status', { status });
    if (targetType) qb.andWhere('r.targetType = :targetType', { targetType });

    qb.orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [reports, total] = await qb.getManyAndCount();
    return { data: reports, total, page, totalPages: Math.ceil(total / limit) };
  }

  async resolveReport(
    id: string,
    action: 'BAN_USER' | 'DELETE_POST' | 'HIDE_POST' | 'WARNING' | 'DISMISS',
    note?: string,
  ) {
    console.log('[Admin] resolveReport 호출 - id:', id, 'action:', action);
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');

    report.status = ReportStatus.RESOLVED;

    if (action === 'BAN_USER') {
      const uid = await this.resolveTargetUserId(report.targetType, report.targetId);
      if (uid) await this.banUser(uid, note ?? '신고 처리로 인한 자동 밴');
    } else if (action === 'DELETE_POST') {
      if (report.targetType === ReportTargetType.POST) {
        await this.deletePost(report.targetId).catch(() => {});
      } else if (report.targetType === ReportTargetType.BOARD) {
        await this.deleteBoard(report.targetId).catch(() => {});
      }
    } else if (action === 'HIDE_POST') {
      if (report.targetType === ReportTargetType.POST) {
        await this.hidePost(report.targetId).catch(() => {});
      }
    } else if (action === 'WARNING') {
      const uid = await this.resolveTargetUserId(report.targetType, report.targetId);
      if (uid) {
        const user = await this.usersRepo.findOne({ where: { id: uid } });
        if (user) {
          user.trustScore = Math.max(0, user.trustScore - 5);
          await this.usersRepo.save(user);
        }
      }
    }
    // DISMISS: just mark resolved

    return this.reportsRepo.save(report);
  }

  private async resolveTargetUserId(targetType: ReportTargetType, targetId: string): Promise<string | null> {
    if (targetType === ReportTargetType.USER) return targetId;
    if (targetType === ReportTargetType.POST) {
      const post = await this.postsRepo.findOne({ where: { id: targetId } });
      return post?.authorId ?? null;
    }
    if (targetType === ReportTargetType.BOARD) {
      const board = await this.boardsRepo.findOne({ where: { id: targetId } });
      return board?.authorId ?? null;
    }
    return null;
  }

  // ─── QnA 관리 ──────────────────────────────────────────────
  async getQnas(
    page: number,
    limit: number,
    status?: QnaStatus,
    category?: QnaCategory,
  ) {
    console.log('[Admin] getQnas 호출 - page:', page, 'status:', status, 'category:', category);
    const qb = this.qnaRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.author', 'author');

    if (status) qb.andWhere('q.status = :status', { status });
    if (category) qb.andWhere('q.category = :category', { category });

    qb.orderBy('q.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [qnas, total] = await qb.getManyAndCount();
    return { data: qnas, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getQnaById(id: string) {
    console.log('[Admin] getQnaById 호출 - id:', id);
    const qna = await this.qnaRepo.findOne({ where: { id }, relations: ['author'] });
    if (!qna) throw new NotFoundException('문의를 찾을 수 없습니다.');
    return qna;
  }

  async answerQna(id: string, answer: string): Promise<Qna> {
    console.log('[Admin] answerQna 호출 - id:', id);
    const qna = await this.qnaRepo.findOne({ where: { id } });
    if (!qna) throw new NotFoundException('문의를 찾을 수 없습니다.');
    qna.answer = answer;
    qna.status = QnaStatus.ANSWERED;
    qna.answeredAt = new Date();
    return this.qnaRepo.save(qna);
  }

  async deleteQna(id: string): Promise<void> {
    console.log('[Admin] deleteQna 호출 - id:', id);
    const qna = await this.qnaRepo.findOne({ where: { id } });
    if (!qna) throw new NotFoundException('문의를 찾을 수 없습니다.');
    await this.qnaRepo.remove(qna);
  }

  // ─── 결제 관리 ──────────────────────────────────────────────
  async getPayments(
    page: number,
    limit: number,
    status?: PaymentStatus,
    type?: string,
  ) {
    console.log('[Admin] getPayments 호출 - page:', page, 'status:', status, 'type:', type);
    const qb = this.paymentsRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'user')
      .leftJoinAndSelect('p.post', 'post');

    if (status) qb.andWhere('p.status = :status', { status });
    if (type) qb.andWhere('p.type = :type', { type });

    qb.orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [payments, total] = await qb.getManyAndCount();
    return { data: payments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async refundPayment(id: string, reason: string) {
    console.log('[Admin] refundPayment 호출 - id:', id, 'reason:', reason);
    const payment = await this.paymentsRepo.findOne({
      where: { id },
      relations: ['post'],
    });
    if (!payment) throw new NotFoundException('결제 내역을 찾을 수 없습니다.');

    payment.status = PaymentStatus.REFUNDED;
    payment.refundReason = reason;

    if (payment.post) {
      payment.post.isPremium = false;
      (payment.post as any).premiumExpiresAt = null;
      await this.postsRepo.save(payment.post);
    }

    return this.paymentsRepo.save(payment);
  }
}
