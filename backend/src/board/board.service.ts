import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, MoreThanOrEqual, Repository } from 'typeorm';
import { Board, BoardType } from './board.entity';
import { BoardTag } from './board-tag.entity';
import { BoardComment } from './board-comment.entity';
import { CreateBoardDto, CreateCommentDto } from './board.dto';
import { UserRole } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardsRepository: Repository<Board>,
    @InjectRepository(BoardComment)
    private readonly commentsRepository: Repository<BoardComment>,
    @InjectRepository(BoardTag)
    private readonly boardTagRepository: Repository<BoardTag>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(filter: {
    type?: BoardType;
    tag?: string;
    sort?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ data: Board[]; total: number; page: number; limit: number }> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;

    const query = this.boardsRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.author', 'author')
      .where('1=1');

    if (filter.type) {
      query.andWhere('board.type = :type', { type: filter.type });
    }

    if (filter.tag) {
      query.andWhere('board.tags LIKE :tag', { tag: `%${filter.tag}%` });
    }

    switch (filter.sort) {
      case 'popular':
        query.orderBy('board.viewCount', 'DESC');
        break;
      case 'comments':
        query.orderBy('board.commentCount', 'DESC');
        break;
      default:
        query.orderBy('board.createdAt', 'DESC');
    }

    const [data, total] = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async getHotBoards(limit = 3): Promise<Board[]> {
    return this.boardsRepository.find({
      where: [
        { type: BoardType.FREE, viewCount: MoreThanOrEqual(50) },
        { type: BoardType.FREE, commentCount: MoreThanOrEqual(5) },
      ],
      order: { viewCount: 'DESC', createdAt: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getRecentBoards(limit = 5): Promise<Board[]> {
    return this.boardsRepository.find({
      where: { type: BoardType.FREE },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['author'],
    });
  }

  async getPopularTags(): Promise<BoardTag[]> {
    return this.boardTagRepository.find({
      order: { useCount: 'DESC' },
      take: 30,
    });
  }

  async searchTags(q: string): Promise<BoardTag[]> {
    if (!q || q.length < 1) return [];
    return this.boardTagRepository.find({
      where: { name: Like(`%${q}%`) },
      order: { useCount: 'DESC' },
      take: 10,
    });
  }

  async getBoardsByTag(
    tag: string,
    page: number,
    limit: number,
  ): Promise<{ data: Board[]; total: number; page: number; limit: number }> {
    const [data, total] = await this.boardsRepository
      .createQueryBuilder('board')
      .leftJoinAndSelect('board.author', 'author')
      .where('board.tags LIKE :tag', { tag: `%${tag}%` })
      .orderBy('board.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string, userId?: string): Promise<{ board: Board; comments: BoardComment[] }> {
    const board = await this.boardsRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!board) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    if (!userId || userId !== board.authorId) {
      await this.boardsRepository.update(id, {
        viewCount: () => 'view_count + 1',
      });
      board.viewCount += 1;
    }

    const comments = await this.commentsRepository.find({
      where: { boardId: id },
      order: { createdAt: 'ASC' },
    });

    const sanitizedBoard = this.sanitizeAnonymous(board);
    const sanitizedComments = comments.map((c) => this.sanitizeAnonymousComment(c));

    return { board: sanitizedBoard, comments: sanitizedComments };
  }

  async create(userId: string, dto: CreateBoardDto): Promise<Board> {
    const isAnonymous = dto.type === BoardType.ANONYMOUS ? (dto.isAnonymous ?? true) : false;
    const tagsString = dto.tags && dto.tags.length > 0 ? dto.tags.join(',') : undefined;
    const board = this.boardsRepository.create({
      type: dto.type,
      title: dto.title,
      content: dto.content,
      isAnonymous,
      authorId: userId,
      tags: tagsString,
    });
    const saved = await this.boardsRepository.save(board);

    if (dto.tags && dto.tags.length > 0) {
      await this.updateTagCounts(dto.tags);
    }

    return saved;
  }

  private async updateTagCounts(tags: string[]): Promise<void> {
    for (const tagName of tags) {
      const tag = await this.boardTagRepository.findOne({ where: { name: tagName } });
      if (tag) {
        await this.boardTagRepository.update(tag.id, { useCount: tag.useCount + 1 });
      } else {
        await this.boardTagRepository.save(
          this.boardTagRepository.create({ name: tagName, useCount: 1 }),
        );
      }
    }
  }

  async delete(userId: string, userRole: UserRole, id: string): Promise<void> {
    const board = await this.boardsRepository.findOne({ where: { id } });
    if (!board) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    if (board.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }
    await this.boardsRepository.remove(board);
  }

  async addComment(userId: string, boardId: string, dto: CreateCommentDto): Promise<BoardComment> {
    const board = await this.boardsRepository.findOne({ where: { id: boardId } });
    if (!board) throw new NotFoundException('게시글을 찾을 수 없습니다.');
    const comment = this.commentsRepository.create({ boardId, authorId: userId, ...dto });
    const saved = await this.commentsRepository.save(comment);

    await this.boardsRepository.increment({ id: boardId }, 'commentCount', 1);

    this.notificationsService
      .sendCommentNotification(userId, board.authorId, boardId)
      .catch(() => {});

    return saved;
  }

  async deleteComment(
    boardId: string,
    commentId: string,
    userId: string,
    userRole: UserRole,
  ): Promise<{ success: boolean }> {
    const comment = await this.commentsRepository.findOne({ where: { id: commentId, boardId } });
    if (!comment) throw new NotFoundException('댓글을 찾을 수 없습니다.');
    if (comment.authorId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenException('삭제 권한이 없습니다.');
    }
    await this.commentsRepository.remove(comment);
    await this.boardsRepository.decrement({ id: boardId }, 'commentCount', 1);
    return { success: true };
  }

  private sanitizeAnonymous(board: Board): Board {
    if (board.isAnonymous && board.author) {
      (board.author as any).nickname = '익명';
      (board.author as any).profileImage = null;
    }
    return board;
  }

  private sanitizeAnonymousComment(comment: BoardComment): BoardComment {
    if (comment.isAnonymous && comment.author) {
      (comment.author as any).nickname = '익명';
      (comment.author as any).profileImage = null;
    }
    return comment;
  }
}
