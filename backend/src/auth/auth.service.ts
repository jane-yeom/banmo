import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

interface KakaoUserInfo {
  id: number;
  kakao_account?: {
    email?: string;
    profile?: {
      nickname?: string;
      profile_image_url?: string;
    };
  };
}

interface KakaoTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
}

export class RegisterDto {
  email: string;
  password: string;
  nickname: string;
  instruments?: string[];
}

export class EmailLoginDto {
  email: string;
  password: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ── 이메일 회원가입 ──────────────────────────────────────────────────────
  async register(dto: RegisterDto): Promise<{ accessToken: string; user: User }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('이미 사용 중인 이메일입니다.');
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createEmailUser({
      email: dto.email,
      password: hashed,
      nickname: dto.nickname,
      instruments: dto.instruments,
    });
    const accessToken = this.issueJwt(user);
    return { accessToken, user };
  }

  // ── 이메일 로그인 ──────────────────────────────────────────────────────
  async emailLogin(dto: EmailLoginDto): Promise<{ accessToken: string; user: User }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.password) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    const accessToken = this.issueJwt(user);
    return { accessToken, user };
  }

  // ── 카카오 AccessToken 방식 (기존 팝업 방식 유지) ──────────────────────
  async kakaoLogin(accessToken: string): Promise<{ accessToken: string; user: User; isNewUser: boolean }> {
    const kakaoUser = await this.getKakaoUserInfo(accessToken);
    return this.kakaoUpsert(kakaoUser);
  }

  // ── 카카오 Authorization Code 방식 (리다이렉트) ──────────────────────
  async kakaoLoginByCode(code: string): Promise<{ accessToken: string; user: User; isNewUser: boolean }> {
    const kakaoAccessToken = await this.exchangeCodeForToken(code);
    const kakaoUser = await this.getKakaoUserInfo(kakaoAccessToken);
    return this.kakaoUpsert(kakaoUser);
  }

  // ── 공통: 카카오 유저 upsert ──────────────────────────────────────────
  private async kakaoUpsert(kakaoUser: KakaoUserInfo): Promise<{ accessToken: string; user: User; isNewUser: boolean }> {
    const kakaoId = String(kakaoUser.id);
    const email = kakaoUser.kakao_account?.email;
    const nickname = kakaoUser.kakao_account?.profile?.nickname;
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url;

    let user = await this.usersService.findByKakaoId(kakaoId);
    const isNewUser = !user;

    if (!user) {
      user = await this.usersService.createKakaoUser({ kakaoId, email, nickname, profileImage });
    }

    const token = this.issueJwt(user);
    return { accessToken: token, user, isNewUser };
  }

  // ── 카카오 code → access_token 교환 ──────────────────────────────────
  async exchangeCodeForToken(code: string): Promise<string> {
    const clientId = this.config.get<string>('KAKAO_REST_API_KEY')
      ?? this.config.get<string>('KAKAO_CLIENT_ID');
    const clientSecret = this.config.get<string>('KAKAO_CLIENT_SECRET') ?? '';
    const redirectUri = this.config.get<string>('KAKAO_FRONTEND_CALLBACK_URL')
      ?? 'http://localhost:3000/auth/callback';

    try {
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId!,
        redirect_uri: redirectUri,
        code,
      });
      if (clientSecret) params.append('client_secret', clientSecret);

      const { data } = await axios.post<KakaoTokenResponse>(
        'https://kauth.kakao.com/oauth/token',
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      return data.access_token;
    } catch {
      throw new UnauthorizedException('카카오 코드 교환에 실패했습니다.');
    }
  }

  private async getKakaoUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    try {
      const { data } = await axios.get<KakaoUserInfo>('https://kapi.kakao.com/v2/user/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
        },
      });
      return data;
    } catch {
      throw new UnauthorizedException('유효하지 않은 카카오 액세스토큰입니다.');
    }
  }

  private issueJwt(user: User): string {
    const payload = { sub: user.id, kakaoId: user.kakaoId };
    return this.jwtService.sign(payload);
  }
}
