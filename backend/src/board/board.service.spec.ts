import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { BoardService } from './board.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Board, BoardType } from './board.entity';
import { BoardComment } from './board-comment.entity';
import { UserRole } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';

describe('BoardService', () => {
  let service: BoardService;

  const mockBoardRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
    increment: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    })),
  };

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn(),
    delete: jest.fn(),
    remove: jest.fn(),
  };

  const mockNotificationsService = {
    sendCommentNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoardService,
        {
          provide: getRepositoryToken(Board),
          useValue: mockBoardRepository,
        },
        {
          provide: getRepositoryToken(BoardComment),
          useValue: mockCommentRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<BoardService>(BoardService);
    jest.clearAllMocks();
  });

  // ─── 자유게시판 테스트 ──────────────────────────────────────────
  describe('자유게시판', () => {
    it('게시글 목록 조회 성공', async () => {
      const mockBoards = [
        { id: '1', title: '테스트', type: BoardType.FREE, isAnonymous: false, createdAt: new Date() },
      ];
      mockBoardRepository.find.mockResolvedValue(mockBoards);

      const result = await service.findAll(BoardType.FREE);
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(mockBoardRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { type: BoardType.FREE } }),
      );
    });

    it('게시글 작성 성공', async () => {
      const dto = { title: '테스트 글', content: '내용', type: BoardType.FREE };
      const mockBoard = { id: '1', ...dto, authorId: 'user-1', isAnonymous: false };
      mockBoardRepository.create.mockReturnValue(mockBoard);
      mockBoardRepository.save.mockResolvedValue(mockBoard);

      const result = await service.create('user-1', dto as any);
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockBoardRepository.save).toHaveBeenCalled();
    });

    it('게시글 상세 조회 성공 + 조회수 증가', async () => {
      const mockBoard = {
        id: '1', title: '테스트', viewCount: 5,
        isAnonymous: false, author: { id: 'user-1', nickname: '김철수' },
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardRepository.increment.mockResolvedValue(undefined);

      const result = await service.findOne('1');
      expect(result).toBeDefined();
      expect(result.board).toBeDefined();
      expect(result.board.viewCount).toBe(6);
      expect(mockBoardRepository.increment).toHaveBeenCalledWith({ id: '1' }, 'viewCount', 1);
    });

    it('존재하지 않는 게시글 조회시 NotFoundException', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });

    it('게시글 삭제 성공 - 본인', async () => {
      const mockBoard = { id: '1', authorId: 'user-1', title: '테스트' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardRepository.remove.mockResolvedValue(mockBoard);

      await expect(
        service.delete('user-1', UserRole.USER, '1'),
      ).resolves.not.toThrow();
    });

    it('게시글 삭제 실패 - 타인', async () => {
      const mockBoard = { id: '1', authorId: 'user-1', title: '테스트' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);

      await expect(
        service.delete('user-2', UserRole.USER, '1'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('게시글 삭제 성공 - 관리자', async () => {
      const mockBoard = { id: '1', authorId: 'user-1', title: '테스트' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardRepository.remove.mockResolvedValue(mockBoard);

      await expect(
        service.delete('admin-1', UserRole.ADMIN, '1'),
      ).resolves.not.toThrow();
    });
  });

  // ─── 익명게시판 테스트 ──────────────────────────────────────────
  describe('익명게시판', () => {
    it('익명 게시글 작성 성공', async () => {
      const dto = {
        title: '익명 테스트',
        content: '익명 내용',
        type: BoardType.ANONYMOUS,
        isAnonymous: true,
      };
      const mockBoard = { id: '2', ...dto, authorId: 'user-1' };
      mockBoardRepository.create.mockReturnValue(mockBoard);
      mockBoardRepository.save.mockResolvedValue(mockBoard);

      const result = await service.create('user-1', dto as any);
      expect(result).toBeDefined();
      expect(result.isAnonymous).toBe(true);
    });

    it('익명 게시글 조회시 작성자 닉네임 익명 처리', async () => {
      const mockBoard = {
        id: '2', title: '익명글', type: BoardType.ANONYMOUS,
        isAnonymous: true,
        author: { id: 'user-1', nickname: '김철수', profileImage: 'profile.jpg' },
        viewCount: 0,
      };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockBoardRepository.increment.mockResolvedValue(undefined);

      const result = await service.findOne('2');
      expect(result.board.isAnonymous).toBe(true);
      expect((result.board.author as any).nickname).toBe('익명');
      expect((result.board.author as any).profileImage).toBeNull();
    });
  });

  // ─── 댓글 테스트 ───────────────────────────────────────────────
  describe('댓글', () => {
    it('댓글 작성 성공', async () => {
      const mockBoard = { id: '1', authorId: 'user-2', title: '테스트' };
      const mockComment = { id: 'c1', content: '댓글입니다', authorId: 'user-1' };
      mockBoardRepository.findOne.mockResolvedValue(mockBoard);
      mockCommentRepository.create.mockReturnValue(mockComment);
      mockCommentRepository.save.mockResolvedValue(mockComment);

      const result = await service.addComment('user-1', '1', {
        content: '댓글입니다',
        isAnonymous: false,
      } as any);
      expect(result).toBeDefined();
      expect(result.content).toBe('댓글입니다');
    });

    it('존재하지 않는 게시글에 댓글 작성시 NotFoundException', async () => {
      mockBoardRepository.findOne.mockResolvedValue(null);

      await expect(
        service.addComment('user-1', '999', { content: '댓글', isAnonymous: false } as any),
      ).rejects.toThrow(NotFoundException);
    });

    it('댓글 삭제 성공 - 본인', async () => {
      const mockComment = {
        id: 'c1', content: '댓글', authorId: 'user-1', boardId: '1',
      };
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.remove.mockResolvedValue(mockComment);

      const result = await service.deleteComment('1', 'c1', 'user-1', UserRole.USER);
      expect(result).toEqual({ success: true });
    });

    it('댓글 삭제 실패 - 타인', async () => {
      const mockComment = {
        id: 'c1', content: '댓글', authorId: 'user-1', boardId: '1',
      };
      mockCommentRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.deleteComment('1', 'c1', 'user-2', UserRole.USER),
      ).rejects.toThrow(ForbiddenException);
    });

    it('댓글 삭제 성공 - 관리자', async () => {
      const mockComment = {
        id: 'c1', content: '댓글', authorId: 'user-1', boardId: '1',
      };
      mockCommentRepository.findOne.mockResolvedValue(mockComment);
      mockCommentRepository.remove.mockResolvedValue(mockComment);

      const result = await service.deleteComment('1', 'c1', 'admin-1', UserRole.ADMIN);
      expect(result).toEqual({ success: true });
    });
  });
});
