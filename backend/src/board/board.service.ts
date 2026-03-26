import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board, BoardType } from './board.entity';
import { BoardComment } from './board-comment.entity';
import { CreateBoardDto, CreateCommentDto } from './board.dto';
import { UserRole } from '../users/user.entity';

@Injectable()
export class BoardService {
  constructor(
    @InjectRepository(Board)
    private readonly boardsRepository: Repository<Board>,
    @InjectRepository(BoardComment)
    private readonly commentsRepository: Repository<BoardComment>,
  ) {}

  async findAll(type?: BoardType): Promise<Board[]> {
    const where = type ? { type } : {};
    return this.boardsRepository.find({
      where,
      relations: ['author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<{ board: Board; comments: BoardComment[] }> {
    const board = await this.boardsRepository.findOne({
      where: { id },
      relations: ['author'],
    });
    if (!board) throw new NotFoundException('게시글을 찾을 수 없습니다.');

    await this.boardsRepository.increment({ id }, 'viewCount', 1);
    board.viewCount += 1;

    const comments = await this.commentsRepository.find({
      where: { boardId: id },
      order: { createdAt: 'ASC' },
    });

    // 익명 처리: 닉네임/프로필 숨김
    const sanitizedBoard = this.sanitizeAnonymous(board);
    const sanitizedComments = comments.map((c) => this.sanitizeAnonymousComment(c));

    return { board: sanitizedBoard, comments: sanitizedComments };
  }

  async create(userId: string, dto: CreateBoardDto): Promise<Board> {
    const isAnonymous = dto.type === BoardType.ANONYMOUS ? (dto.isAnonymous ?? true) : false;
    const board = this.boardsRepository.create({ ...dto, authorId: userId, isAnonymous });
    return this.boardsRepository.save(board);
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
    return this.commentsRepository.save(comment);
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
