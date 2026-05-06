import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { RegisterDto, LoginDto as EmailLoginDto } from './auth.dto';

export { RegisterDto, EmailLoginDto };

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
    return { accessToken: this.generateToken(user), user };
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
    return { accessToken: this.generateToken(user), user };
  }

  // ── 카카오 AccessToken 방식 (레거시) ──────────────────────────────────
  async kakaoLogin(accessToken: string): Promise<{ accessToken: string; user: User; isNewUser: boolean }> {
    const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return this.kakaoUpsert(userRes.data);
  }

  // ── 카카오 Authorization Code 방식 (리다이렉트 콜백) ─────────────────
  async kakaoLoginWithCode(code: string): Promise<{ accessToken: string; user: User; isNewUser?: boolean }> {
    console.log('[Auth] 카카오 콜백 처리 시작, code:', !!code);
    try {

      // 1단계: code → accessToken 교환
      const params = new URLSearchParams();
      params.append('grant_type', 'authorization_code');
      params.append('client_id', this.config.get<string>('KAKAO_REST_API_KEY')!);
      params.append('redirect_uri', this.config.get<string>('KAKAO_CALLBACK_URL')!);
      params.append('code', code);
      params.append('client_secret', this.config.get<string>('KAKAO_CLIENT_SECRET')!);


      const tokenRes = await axios.post(
        'https://kauth.kakao.com/oauth/token',
        params.toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      const accessToken: string = tokenRes.data.access_token;
      console.log('[Auth] 카카오 토큰 교환 완료');

      // 2단계: accessToken으로 유저정보 조회
      const userRes = await axios.get('https://kapi.kakao.com/v2/user/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const kakaoId      = String(userRes.data.id);
      const nickname     = userRes.data.kakao_account?.profile?.nickname || '반모유저';
      const email        = userRes.data.kakao_account?.email as string | undefined;
      const profileImage = userRes.data.kakao_account?.profile?.profile_image_url as string | undefined;

      // 3단계: DB에서 유저 찾거나 생성
      let user = await this.usersService.findByKakaoId(kakaoId);
      const isNewUser = !user;
      if (!user) {
        user = await this.usersService.createKakaoUser({ kakaoId, nickname, email, profileImage });
      } else {
      }

      // 4단계: JWT 발급
      const jwtToken = this.generateToken(user);
      console.log('[Auth] 유저 처리 완료:', user.id);

      return { accessToken: jwtToken, user, isNewUser };

    } catch (error: any) {
      console.error('[카카오] 오류 발생:', error.response?.data ?? error.message);
      throw new UnauthorizedException(
        '카카오 로그인 실패: ' + (error.response?.data?.error_description ?? error.message),
      );
    }
  }

  // 하위 호환
  async kakaoLoginByCode(code: string) {
    return this.kakaoLoginWithCode(code);
  }

  private async kakaoUpsert(data: any): Promise<{ accessToken: string; user: User; isNewUser: boolean }> {
    const kakaoId      = String(data.id);
    const email        = data.kakao_account?.email as string | undefined;
    const nickname     = data.kakao_account?.profile?.nickname as string | undefined;
    const profileImage = data.kakao_account?.profile?.profile_image_url as string | undefined;

    let user = await this.usersService.findByKakaoId(kakaoId);
    const isNewUser = !user;
    if (!user) {
      user = await this.usersService.createKakaoUser({ kakaoId, email, nickname, profileImage });
    }
    return { accessToken: this.generateToken(user), user, isNewUser };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
