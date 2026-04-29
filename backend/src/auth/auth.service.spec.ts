import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-1',
    email: 'test@test.com',
    password: '$2b$10$hashedpassword',
    nickname: '테스터',
    role: 'USER',
    isBanned: false,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByKakaoId: jest.fn(),
    createEmailUser: jest.fn(),
    createKakaoUser: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock.jwt.token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  // ─── 이메일 인증 테스트 ──────────────────────────────────────────
  describe('이메일 인증', () => {
    it('회원가입 성공', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createEmailUser.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'new@test.com',
        password: 'password123!',
        nickname: '새유저',
        instruments: [],
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user).toBeDefined();
    });

    it('중복 이메일 회원가입 실패', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@test.com',
          password: 'password123!',
          nickname: '테스터',
          instruments: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('이메일 로그인 성공', async () => {
      const hashed = await bcrypt.hash('correct_password', 10);
      const userWithHash = { ...mockUser, password: hashed };
      mockUsersService.findByEmail.mockResolvedValue(userWithHash);

      const result = await service.emailLogin({
        email: 'test@test.com',
        password: 'correct_password',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('잘못된 비밀번호 로그인 실패', async () => {
      const hashed = await bcrypt.hash('correct_password', 10);
      const userWithHash = { ...mockUser, password: hashed };
      mockUsersService.findByEmail.mockResolvedValue(userWithHash);

      await expect(
        service.emailLogin({
          email: 'test@test.com',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('존재하지 않는 이메일 로그인 실패', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.emailLogin({
          email: 'notexist@test.com',
          password: 'password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('JWT 토큰 발급 확인', async () => {
      const hashed = await bcrypt.hash('password123!', 10);
      const userWithHash = { ...mockUser, password: hashed };
      mockUsersService.findByEmail.mockResolvedValue(userWithHash);

      const result = await service.emailLogin({
        email: 'test@test.com',
        password: 'password123!',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
        }),
      );
      expect(result.accessToken).toBe('mock.jwt.token');
    });
  });
});
