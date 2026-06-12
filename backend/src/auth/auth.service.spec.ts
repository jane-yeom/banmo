import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

jest.mock('axios');

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: 'user-uuid-1',
    username: 'testuser',
    email: 'test@test.com',
    password: '$2b$10$hashedpassword',
    nickname: '테스터',
    role: 'USER',
    isBanned: false,
    isEmailVerified: true,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    findByUsername: jest.fn(),
    findByNickname: jest.fn(),
    findByKakaoId: jest.fn(),
    createEmailUser: jest.fn(),
    createKakaoUser: jest.fn(),
    saveResetToken: jest.fn(),
    updateVerifyToken: jest.fn().mockResolvedValue(undefined),
  };

  const mockKakaoUser = {
    id: 'kakao-uuid-1',
    kakaoId: '12345678',
    email: 'kakao@kakao.com',
    nickname: '카카오유저',
    profileImage: null,
    role: 'USER',
    isBanned: false,
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
    it('회원가입 성공 - 이메일 인증 메일 발송', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.findByNickname.mockResolvedValue(null);
      mockUsersService.createEmailUser.mockResolvedValue(mockUser);

      const result = await service.register({
        username: 'testuser',
        email: 'new@test.com',
        password: 'password123!',
        nickname: '새유저',
      });

      expect(result).toBeDefined();
      expect(result.message).toBeDefined();
    });

    it('중복 이메일 회원가입 실패', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({
          username: 'testuser',
          email: 'test@test.com',
          password: 'password123!',
          nickname: '테스터',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('중복 아이디 회원가입 실패', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(
        service.register({
          username: 'testuser',
          email: 'new@test.com',
          password: 'password123!',
          nickname: '새유저',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('이메일(username) 로그인 성공', async () => {
      const hashed = await bcrypt.hash('correct_password', 10);
      const userWithHash = { ...mockUser, password: hashed };
      mockUsersService.findByUsername.mockResolvedValue(userWithHash);

      const result = await service.emailLogin({
        username: 'testuser',
        password: 'correct_password',
      });

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.email).toBe('test@test.com');
    });

    it('잘못된 비밀번호 로그인 실패', async () => {
      const hashed = await bcrypt.hash('correct_password', 10);
      const userWithHash = { ...mockUser, password: hashed };
      mockUsersService.findByUsername.mockResolvedValue(userWithHash);
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.emailLogin({
          username: 'testuser',
          password: 'wrong_password',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('존재하지 않는 계정 로그인 실패', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.emailLogin({
          username: 'notexist',
          password: 'password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('이메일 미인증 계정 로그인 실패', async () => {
      const hashed = await bcrypt.hash('password123!', 10);
      const unverifiedUser = { ...mockUser, password: hashed, isEmailVerified: false };
      mockUsersService.findByUsername.mockResolvedValue(unverifiedUser);

      await expect(
        service.emailLogin({
          username: 'testuser',
          password: 'password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('JWT 토큰 발급 확인', async () => {
      const hashed = await bcrypt.hash('password123!', 10);
      const userWithHash = { ...mockUser, password: hashed };
      mockUsersService.findByUsername.mockResolvedValue(userWithHash);

      const result = await service.emailLogin({
        username: 'testuser',
        password: 'password123!',
      });

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: mockUser.id,
          role: mockUser.role,
        }),
      );
      expect(result.accessToken).toBe('mock.jwt.token');
    });
  });

  // ─── 카카오 로그인 테스트 ──────────────────────────────────────────
  describe('카카오 로그인 (isNewUser 검증)', () => {
    const kakaoUserInfoResponse = {
      data: {
        id: 12345678,
        kakao_account: {
          email: 'kakao@kakao.com',
          profile: {
            nickname: '카카오유저',
            profile_image_url: null,
          },
        },
      },
    };

    const kakaoTokenResponse = {
      data: { access_token: 'kakao-access-token' },
    };

    beforeEach(() => {
      (axios.post as jest.Mock).mockResolvedValue(kakaoTokenResponse);
      (axios.get as jest.Mock).mockResolvedValue(kakaoUserInfoResponse);
    });

    it('신규 유저: isNewUser = true 반환', async () => {
      mockUsersService.findByKakaoId.mockResolvedValue(null);
      mockUsersService.createKakaoUser.mockResolvedValue(mockKakaoUser);

      const result = await service.kakaoLoginWithCode('auth-code-new');

      expect(result.isNewUser).toBe(true);
      expect(mockUsersService.createKakaoUser).toHaveBeenCalledWith(
        expect.objectContaining({ kakaoId: '12345678' }),
      );
    });

    it('기존 유저: isNewUser = false 반환', async () => {
      mockUsersService.findByKakaoId.mockResolvedValue(mockKakaoUser);

      const result = await service.kakaoLoginWithCode('auth-code-existing');

      expect(result.isNewUser).toBe(false);
      expect(mockUsersService.createKakaoUser).not.toHaveBeenCalled();
    });

    it('신규 유저: JWT 발급 및 user 반환', async () => {
      mockUsersService.findByKakaoId.mockResolvedValue(null);
      mockUsersService.createKakaoUser.mockResolvedValue(mockKakaoUser);

      const result = await service.kakaoLoginWithCode('auth-code-jwt');

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user).toMatchObject({ kakaoId: '12345678' });
    });

    it('기존 유저: JWT 발급 및 기존 user 반환', async () => {
      mockUsersService.findByKakaoId.mockResolvedValue(mockKakaoUser);

      const result = await service.kakaoLoginWithCode('auth-code-existing-jwt');

      expect(result.accessToken).toBe('mock.jwt.token');
      expect(result.user.id).toBe('kakao-uuid-1');
    });

    it('카카오 API 오류시 UnauthorizedException 발생', async () => {
      (axios.post as jest.Mock).mockRejectedValue(
        Object.assign(new Error('invalid_code'), {
          response: { data: { error_description: 'invalid authorization code' } },
        }),
      );

      await expect(service.kakaoLoginWithCode('bad-code')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('카카오 토큰 교환 성공 후 유저 정보 조회', async () => {
      mockUsersService.findByKakaoId.mockResolvedValue(mockKakaoUser);

      await service.kakaoLoginWithCode('valid-code');

      expect(axios.post).toHaveBeenCalledWith(
        'https://kauth.kakao.com/oauth/token',
        expect.any(String),
        expect.objectContaining({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
      );
      expect(axios.get).toHaveBeenCalledWith(
        'https://kapi.kakao.com/v2/user/me',
        expect.objectContaining({ headers: { Authorization: 'Bearer kakao-access-token' } }),
      );
    });
  });
});
