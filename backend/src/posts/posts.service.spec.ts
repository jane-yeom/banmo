import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostsService } from './posts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Post, PayType, PostStatus } from './post.entity';
import { TrustService } from '../users/trust.service';
import { NotificationsService } from '../notifications/notifications.service';
import { FavoritesService } from '../favorites/favorites.service';

describe('PostsService', () => {
  let service: PostsService;

  const getManyAndCountMock = jest.fn().mockResolvedValue([[], 0]);

  const mockQb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    addOrderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: getManyAndCountMock,
  };

  const mockPostRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    increment: jest.fn().mockResolvedValue(undefined),
    createQueryBuilder: jest.fn(() => mockQb),
  };

  const mockTrustService = {
    applyEvent: jest.fn().mockResolvedValue(undefined),
  };

  const mockNotificationsService = {
    sendKeywordNotification: jest.fn().mockResolvedValue(undefined),
  };

  const mockFavoritesService = {
    notifyFavoriteUsers: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useValue: mockPostRepository },
        { provide: TrustService, useValue: mockTrustService },
        { provide: NotificationsService, useValue: mockNotificationsService },
        { provide: FavoritesService, useValue: mockFavoritesService },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    jest.clearAllMocks();
  });

  // ─── 공고 CRUD 테스트 ──────────────────────────────────────────
  describe('공고 CRUD', () => {
    it('공고 목록 조회 성공', async () => {
      const mockPosts = [
        { id: '1', title: '피아노 반주자 구함', status: PostStatus.ACTIVE, isPremium: false },
      ];
      getManyAndCountMock.mockResolvedValueOnce([mockPosts, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result).toBeDefined();
      expect(result.total).toBe(1);
    });

    it('공고 상세 조회 + 조회수 증가', async () => {
      const mockPost = { id: '1', title: '공고', viewCount: 3, authorId: 'user-1' };
      mockPostRepository.findOne.mockResolvedValue(mockPost);
      mockPostRepository.increment.mockResolvedValue(undefined);

      const result = await service.findOne('1');
      expect(result).toBeDefined();
      expect(result.viewCount).toBe(4);
      expect(mockPostRepository.increment).toHaveBeenCalledWith({ id: '1' }, 'viewCount', 1);
    });

    it('공고 작성 성공', async () => {
      const dto = {
        title: '피아노 반주자 구함',
        content: '내용',
        category: 'JOB_OFFER',
        payType: PayType.HOURLY,
        payMin: 15000,
      };
      const mockPost = { id: '1', ...dto, authorId: 'user-1' };
      mockPostRepository.create.mockReturnValue(mockPost);
      mockPostRepository.save.mockResolvedValue(mockPost);

      const result = await service.create('user-1', dto as any);
      expect(result).toBeDefined();
      expect(result.id).toBe('1');
      expect(mockPostRepository.save).toHaveBeenCalled();
    });

    it('최저시급 이하 공고 작성 실패', async () => {
      const dto = {
        title: '공고',
        content: '내용',
        payType: PayType.HOURLY,
        payMin: 5000,
      };

      await expect(service.create('user-1', dto as any)).rejects.toThrow(BadRequestException);
    });

    it('공고 수정 성공 - 본인', async () => {
      const mockPost = {
        id: '1', title: '원래 제목', authorId: 'user-1',
        payType: PayType.HOURLY, payMin: 15000,
      };
      mockPostRepository.findOne.mockResolvedValue(mockPost);
      mockPostRepository.save.mockResolvedValue({ ...mockPost, title: '수정된 제목' });

      const result = await service.update('user-1', '1', { title: '수정된 제목' } as any);
      expect(result.title).toBe('수정된 제목');
    });

    it('공고 수정 실패 - 타인', async () => {
      const mockPost = { id: '1', title: '공고', authorId: 'user-1', payType: PayType.HOURLY, payMin: 15000 };
      mockPostRepository.findOne.mockResolvedValue(mockPost);

      await expect(
        service.update('user-2', '1', { title: '수정' } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('공고 삭제 성공 - 본인', async () => {
      const mockPost = { id: '1', authorId: 'user-1', title: '공고' };
      mockPostRepository.findOne.mockResolvedValue(mockPost);
      mockPostRepository.remove.mockResolvedValue(mockPost);

      await expect(service.delete('user-1', '1')).resolves.not.toThrow();
    });

    it('공고 삭제 실패 - 타인', async () => {
      const mockPost = { id: '1', authorId: 'user-1', title: '공고' };
      mockPostRepository.findOne.mockResolvedValue(mockPost);

      await expect(service.delete('user-2', '1')).rejects.toThrow(ForbiddenException);
    });

    it('카테고리 필터 조회', async () => {
      getManyAndCountMock.mockResolvedValueOnce([[{ id: '1', category: 'JOB_OFFER' }], 1]);

      const result = await service.findAll({ category: 'JOB_OFFER', page: 1, limit: 10 });
      expect(result.total).toBe(1);
    });

    it('존재하지 않는 공고 조회시 NotFoundException', async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });
});
