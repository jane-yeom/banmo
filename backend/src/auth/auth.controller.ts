// TODO: 이메일 로그인 - 현재 카카오 로그인만 지원
// 추후 필요시 register/login 주석 해제

import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { User } from '../users/user.entity';

class KakaoLoginDto {
  @IsString()
  accessToken: string;
}

class KakaoCallbackDto {
  @IsString()
  code: string;
}

class AdminLoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // 이메일 회원가입 비활성화 (카카오 로그인만 사용)
  // @Post('register')
  // async register(@Body() dto: RegisterDto) { ... }

  // 이메일 인증 비활성화
  // @Post('verify-email')
  // async verifyEmail(@Body('token') token: string) { ... }

  // 이메일 재발송 비활성화
  // @Post('resend-verify')
  // async resendVerify(@Body('email') email: string) { ... }

  // 이메일 로그인 비활성화
  // @Post('login')
  // async emailLogin(@Body() dto: LoginDto) { ... }

  // 아이디 중복확인 비활성화
  // @Get('check-username')
  // async checkUsername(@Query('username') username: string) { ... }

  // 비밀번호 찾기 비활성화
  // @Post('forgot-password')
  // async forgotPassword(@Body() dto: { username: string; email: string }) { ... }

  /** 카카오 AccessToken 방식 (레거시) */
  @Post('kakao')
  async kakaoLogin(@Body() body: KakaoLoginDto) {
    return this.authService.kakaoLogin(body.accessToken);
  }

  /** 카카오 Authorization Code 방식 (리다이렉트 콜백) */
  @Post('kakao/callback')
  @HttpCode(200)
  async kakaoCallback(@Body() body: KakaoCallbackDto) {
    return this.authService.kakaoLoginWithCode(body.code);
  }

  /** 관리자 전용 이메일 로그인 */
  @Post('admin/login')
  @HttpCode(200)
  async adminLogin(@Body() dto: AdminLoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }

  /** 비밀번호 재설정 요청 */
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body('email') email: string) {
    return this.authService.resetPassword(email);
  }

  /** 비밀번호 재설정 확인 */
  @Post('confirm-reset')
  @HttpCode(200)
  async confirmReset(
    @Body('token') token: string,
    @Body('newPassword') newPassword: string,
  ) {
    return this.authService.confirmReset(token, newPassword);
  }

  /** 현재 유저 정보 */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
