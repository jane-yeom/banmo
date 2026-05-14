import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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

  // ── 아이디 중복확인 ───────────────────────────────────────────────────
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    const existing = await this.usersService.findByUsername(username);
    return { available: !existing };
  }

  // ── 회원가입 (아이디/비밀번호 방식) ──────────────────────────────────
  async register(dto: RegisterDto): Promise<{ message: string }> {
    const usernameRegex = /^[a-zA-Z0-9_]{4,20}$/;
    if (!usernameRegex.test(dto.username)) {
      throw new BadRequestException('아이디는 영문, 숫자, _(밑줄)만 4~20자 사용 가능합니다.');
    }
    const existingUsername = await this.usersService.findByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('이미 사용 중인 아이디입니다.');
    }
    const existingEmail = await this.usersService.findByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('이미 사용 중인 이메일입니다.');
    }
    const existingNickname = await this.usersService.findByNickname(dto.nickname);
    if (existingNickname) {
      throw new ConflictException('이미 사용 중인 닉네임입니다.');
    }
    const hashed = await bcrypt.hash(dto.password, 12);
    const user = await this.usersService.createEmailUser({
      username: dto.username,
      email: dto.email,
      password: hashed,
      nickname: dto.nickname,
      instruments: dto.instruments,
    });
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.usersService.updateVerifyToken(user.id, token, expires);
    await this.sendVerifyEmail(dto.email, token);
    return { message: '가입 완료! 입력하신 이메일로 인증 링크를 보냈어요.' };
  }

  // ── 이메일 인증 ───────────────────────────────────────────────────────
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmailVerifyToken(token);
    if (!user) throw new BadRequestException('유효하지 않은 인증 링크입니다.');
    if (new Date() > (user as any).emailVerifyExpires) {
      throw new BadRequestException('만료된 인증 링크입니다. 재발송을 요청해주세요.');
    }
    await this.usersService.verifyEmailUser(user.id);
    return { message: '이메일 인증이 완료되었습니다.' };
  }

  // ── 인증 메일 재발송 ──────────────────────────────────────────────────
  async resendVerifyEmail(email: string): Promise<{ message: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return { message: '이메일을 확인해주세요.' };
    if ((user as any).isEmailVerified) {
      throw new BadRequestException('이미 인증된 이메일입니다.');
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await this.usersService.updateVerifyToken(user.id, token, expires);
    await this.sendVerifyEmail(email, token);
    return { message: '인증 이메일이 재발송되었습니다.' };
  }

  // ── 인증 이메일 발송 ──────────────────────────────────────────────────
  async sendVerifyEmail(email: string, token: string): Promise<void> {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    });
    const verifyUrl = `${this.config.get('FRONTEND_URL')}/auth/verify-email?token=${token}`;
    await transporter.sendMail({
      from: `반모 <${this.config.get('MAIL_USER')}>`,
      to: email,
      subject: '[반모] 이메일 인증',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>이메일 인증</h2>
          <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
          <p>링크는 24시간 후 만료됩니다.</p>
          <a href="${verifyUrl}"
            style="display:inline-block; padding:12px 24px;
            background:#7B82BE; color:white; border-radius:8px;
            text-decoration:none; font-weight:bold;">
            이메일 인증하기
          </a>
          <p style="color:#999; font-size:12px; margin-top:20px;">
            본인이 요청하지 않았다면 이 이메일을 무시해주세요.
          </p>
        </div>
      `,
    });
  }

  // ── 일반 유저 비밀번호 찾기 (아이디 + 이메일 확인) ──────────────────
  async forgotPasswordUser(dto: { username: string; email: string }): Promise<{ message: string }> {
    const user = await this.usersService.findByUsername(dto.username);
    // 보안상 동일한 메시지 반환
    if (!user || user.email !== dto.email) {
      return { message: '이메일을 확인해주세요.' };
    }
    if ((user as any).role === 'ADMIN') {
      throw new ForbiddenException('관리자는 관리자 페이지에서 비밀번호를 찾아주세요.');
    }
    if (!user.password) {
      throw new BadRequestException('카카오로 가입한 계정은 비밀번호를 재설정할 수 없습니다.');
    }
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    await this.usersService.saveResetToken(user.id, token, expires);
    const resetUrl = `${this.config.get('FRONTEND_URL')}/reset-password?token=${token}`;
    await this.sendResetEmail(user.email, resetUrl);
    return { message: '이메일을 확인해주세요.' };
  }

  // ── 로그인 (아이디 + 비밀번호) ───────────────────────────────────────
  async emailLogin(dto: EmailLoginDto): Promise<{ accessToken: string; user: User }> {
    // username 또는 email 둘 다 허용
    let user = await this.usersService.findByUsername(dto.username);
    if (!user) {
      user = await this.usersService.findByEmail(dto.username);
    }
    if (!user || !user.password) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 틀렸습니다.');
    }
    if ((user as any).role === 'ADMIN') {
      throw new UnauthorizedException('관리자는 관리자 페이지에서 로그인해주세요.');
    }
    if (user.isBanned) {
      throw new UnauthorizedException('이용이 제한된 계정입니다.');
    }
    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) {
      throw new UnauthorizedException('아이디 또는 비밀번호가 틀렸습니다.');
    }
    if (!(user as any).isEmailVerified) {
      throw new UnauthorizedException('이메일 인증이 필요합니다. 메일함을 확인해주세요.');
    }
    return { accessToken: this.generateToken(user), user };
  }

  // ── 관리자 전용 이메일 로그인 ───────────────────────────────────────────
  async adminLogin(email: string, password: string): Promise<{ accessToken: string; user: User }> {
    console.log('[Admin] 로그인 시도:', email);
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('존재하지 않는 계정입니다.');
    }
    if (user.role !== 'ADMIN' as any) {
      throw new UnauthorizedException('관리자 계정이 아닙니다.');
    }
    if (!user.password) {
      throw new UnauthorizedException('비밀번호가 설정되지 않은 계정입니다.');
    }
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new UnauthorizedException('비밀번호가 틀렸습니다.');
    }
    console.log('[Admin] 로그인 성공:', user.id);
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
        user = await this.usersService.createKakaoUser({
          kakaoId,
          nickname,
          kakaoNickname: nickname,
          kakaoEmail: email,
          kakaoProfileImage: profileImage,
          email,
          profileImage,
        });
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
      user = await this.usersService.createKakaoUser({
        kakaoId,
        nickname,
        kakaoNickname: nickname,
        kakaoEmail: email,
        kakaoProfileImage: profileImage,
        email,
        profileImage,
      });
    }
    return { accessToken: this.generateToken(user), user, isNewUser };
  }

  async resetPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return { success: true, message: '이메일을 확인해주세요' };
    }
    if ((user as any).role !== 'ADMIN') {
      throw new ForbiddenException('관리자 계정만 비밀번호 재설정이 가능합니다');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);

    await this.usersService.saveResetToken(user.id, token, expires);

    const resetUrl = `${this.config.get('FRONTEND_URL')}/admin/reset-password?token=${token}`;
    await this.sendResetEmail(email, resetUrl);

    return { success: true, message: '비밀번호 재설정 링크를 이메일로 발송했습니다' };
  }

  async sendResetEmail(email: string, resetUrl: string) {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.config.get('MAIL_USER'),
        pass: this.config.get('MAIL_PASS'),
      },
    });

    await transporter.sendMail({
      from: `반모 관리자 <${this.config.get('MAIL_USER')}>`,
      to: email,
      subject: '[반모] 비밀번호 재설정',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2>비밀번호 재설정</h2>
          <p>아래 링크를 클릭하여 비밀번호를 재설정해주세요.</p>
          <p>링크는 30분 후 만료됩니다.</p>
          <a href="${resetUrl}"
            style="display:inline-block; padding:12px 24px;
            background:#7B82BE; color:white; border-radius:8px;
            text-decoration:none; font-weight:bold;">
            비밀번호 재설정
          </a>
          <p style="color:#999; font-size:12px; margin-top:20px;">
            본인이 요청하지 않았다면 이 이메일을 무시해주세요.
          </p>
        </div>
      `,
    });
  }

  async confirmReset(token: string, newPassword: string) {
    const user = await this.usersService.findByResetToken(token);
    if (!user) throw new BadRequestException('유효하지 않은 토큰입니다');
    if (new Date() > (user as any).resetTokenExpires) {
      throw new BadRequestException('만료된 토큰입니다');
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await this.usersService.updatePassword(user.id, hashed);

    return { success: true, message: '비밀번호가 변경되었습니다' };
  }

  private generateToken(user: User): string {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }
}
