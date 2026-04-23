import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, IsNull } from 'typeorm';
import { User, NoteGrade } from '../users/user.entity';
import { Post, PostStatus } from '../posts/post.entity';
import { Board, BoardType } from '../board/board.entity';
import { BoardComment } from '../board/board-comment.entity';
import { Report, ReportReason, ReportStatus, ReportTargetType } from '../reports/report.entity';
import { Qna, QnaCategory, QnaStatus } from './qna.entity';
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
    private readonly trustService: TrustService,
  ) {}

  // ─── 회원 관리 ──────────────────────────────────────────────
  async getUsers(
    search: string,
    page: number,
    limit: number,
    grade?: NoteGrade,
    isBanned?: boolean,
  ) {
    const qb = this.usersRepo.createQueryBuilder('u');

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
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getUserById(id: string) {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    const posts = await this.postsRepo.find({
      where: { authorId: id },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const reports = await this.reportsRepo.find({
      where: { targetId: id, targetType: ReportTargetType.USER },
      order: { createdAt: 'DESC' },
    });

    return { user, posts, reports };
  }

  async banUser(id: string, banReason?: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.isBanned = true;
    if (banReason) user.banReason = banReason;
    return this.usersRepo.save(user);
  }

  async unbanUser(id: string): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.isBanned = false;
    (user as any).banReason = null;
    return this.usersRepo.save(user);
  }

  async setGrade(id: string, grade: NoteGrade): Promise<User> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    user.noteGrade = grade;
    return this.usersRepo.save(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.usersRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    await this.usersRepo.remove(user);
  }

  // ─── 공고 관리 ──────────────────────────────────────────────
  async getPosts(
    page: number,
    limit: number,
    search?: string,
    category?: string,
    status?: string,
  ) {
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

    qb.orderBy('p.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [posts, total] = await qb.getManyAndCount();
    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async hidePost(id: string): Promise<Post> {
    const post = await this.postsRepo.findOne({ where: { id } });
    if (!post) throw new NotFoundException('공고를 찾을 수 없습니다.');
    post.status = PostStatus.HIDDEN;
    return this.postsRepo.save(post);
  }

  async deletePost(id: string): Promise<void> {
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
    const qb = this.boardsRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.author', 'author');

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

    // 각 게시글의 댓글 수
    const boardsWithCount = await Promise.all(
      boards.map(async (b) => {
        const commentCount = await this.commentsRepo.count({ where: { boardId: b.id } });
        return { ...b, commentCount };
      }),
    );

    return { boards: boardsWithCount, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getBoardComments(boardId: string) {
    return this.commentsRepo.find({
      where: { boardId },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteBoard(id: string): Promise<void> {
    const board = await this.boardsRepo.findOne({ where: { id } });
    if (!board) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    await this.commentsRepo.delete({ boardId: id });
    await this.boardsRepo.remove(board);
  }

  async deleteBoardComment(boardId: string, commentId: string): Promise<void> {
    const comment = await this.commentsRepo.findOne({
      where: { id: commentId, boardId },
    });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    await this.commentsRepo.remove(comment);
  }

  // ─── 공지사항 관리 ──────────────────────────────────────────────
  async getNotices(page: number, limit: number) {
    const [boards, total] = await this.boardsRepo.findAndCount({
      where: { type: BoardType.NOTICE },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { notices: boards, total, page, totalPages: Math.ceil(total / limit) };
  }

  async createNotice(
    title: string,
    content: string,
    adminId: string,
  ): Promise<Board> {
    const board = this.boardsRepo.create({
      type: BoardType.NOTICE,
      title,
      content,
      authorId: adminId,
    });
    return this.boardsRepo.save(board);
  }

  async updateNotice(id: string, title: string, content: string): Promise<Board> {
    const board = await this.boardsRepo.findOne({
      where: { id, type: BoardType.NOTICE },
    });
    if (!board) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    board.title = title;
    board.content = content;
    return this.boardsRepo.save(board);
  }

  async deleteNotice(id: string): Promise<void> {
    const board = await this.boardsRepo.findOne({
      where: { id, type: BoardType.NOTICE },
    });
    if (!board) throw new NotFoundException('공지사항을 찾을 수 없습니다.');
    await this.boardsRepo.remove(board);
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
    return { reports: items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async resolveReport(
    id: string,
    action: 'BAN_USER' | 'DELETE_POST' | 'WARNING' | 'DISMISS',
  ): Promise<Report> {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');

    report.status = ReportStatus.RESOLVED;

    if (action === 'BAN_USER') {
      const targetUserId = await this.resolveTargetUserId(report.targetType, report.targetId);
      if (targetUserId) {
        await this.banUser(targetUserId, '신고 처리로 인한 자동 밴');
      }
    } else if (action === 'DELETE_POST') {
      if (report.targetType === ReportTargetType.POST) {
        await this.deletePost(report.targetId).catch(() => {});
      } else if (report.targetType === ReportTargetType.BOARD) {
        await this.deleteBoard(report.targetId).catch(() => {});
      }
    } else if (action === 'WARNING') {
      const targetUserId = await this.resolveTargetUserId(report.targetType, report.targetId);
      if (targetUserId) {
        await this.trustService.applyEvent(targetUserId, TrustEvent.REPORTED).catch(() => {});
      }
    }
    // DISMISS: just mark as resolved, no action

    return this.reportsRepo.save(report);
  }

  async updateReport(id: string, status: ReportStatus): Promise<Report> {
    const report = await this.reportsRepo.findOne({ where: { id } });
    if (!report) throw new NotFoundException('신고를 찾을 수 없습니다.');

    const wasResolved = report.status !== ReportStatus.RESOLVED && status === ReportStatus.RESOLVED;
    report.status = status;
    const saved = await this.reportsRepo.save(report);

    if (wasResolved) {
      const targetUserId = await this.resolveTargetUserId(report.targetType, report.targetId);
      if (targetUserId) {
        const event =
          report.reason === ReportReason.FRAUD ? TrustEvent.FRAUD_RESOLVED : TrustEvent.REPORTED;
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
    if (targetType === ReportTargetType.BOARD) {
      const board = await this.boardsRepo.findOne({ where: { id: targetId } });
      return board?.authorId ?? null;
    }
    return null;
  }

  async getRecentReports(limit = 5) {
    return this.reportsRepo.find({
      relations: ['reporter'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // ─── QnA 관리 ──────────────────────────────────────────────
  async getQnas(
    page: number,
    limit: number,
    status?: QnaStatus,
    category?: QnaCategory,
  ) {
    const qb = this.qnaRepo
      .createQueryBuilder('q')
      .leftJoinAndSelect('q.author', 'author');

    if (status) qb.andWhere('q.status = :status', { status });
    if (category) qb.andWhere('q.category = :category', { category });

    qb.orderBy('q.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [qnas, total] = await qb.getManyAndCount();
    return { qnas, total, page, totalPages: Math.ceil(total / limit) };
  }

  async answerQna(id: string, answer: string): Promise<Qna> {
    const qna = await this.qnaRepo.findOne({ where: { id } });
    if (!qna) throw new NotFoundException('문의를 찾을 수 없습니다.');
    qna.answer = answer;
    qna.status = QnaStatus.ANSWERED;
    qna.answeredAt = new Date();
    return this.qnaRepo.save(qna);
  }

  async deleteQna(id: string): Promise<void> {
    const qna = await this.qnaRepo.findOne({ where: { id } });
    if (!qna) throw new NotFoundException('문의를 찾을 수 없습니다.');
    await this.qnaRepo.remove(qna);
  }

  // ─── 통계 ───────────────────────────────────────────────────
  async getStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalPosts,
      totalBoards,
      totalReports,
      pendingReports,
      unansweredQna,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.postsRepo.count(),
      this.boardsRepo.count(),
      this.reportsRepo.count(),
      this.reportsRepo.count({ where: { status: ReportStatus.PENDING } }),
      this.qnaRepo.count({ where: { status: QnaStatus.PENDING } }),
    ]);

    const todayUsers = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.createdAt >= :start', { start: todayStart })
      .getCount();

    const todayPosts = await this.postsRepo
      .createQueryBuilder('p')
      .where('p.createdAt >= :start', { start: todayStart })
      .getCount();

    const monthUsers = await this.usersRepo
      .createQueryBuilder('u')
      .where('u.createdAt >= :start', { start: monthStart })
      .getCount();

    return {
      totalUsers,
      totalPosts,
      totalBoards,
      totalReports,
      pendingReports,
      unansweredQna,
      todayUsers,
      todayPosts,
      monthUsers,
    };
  }
}
