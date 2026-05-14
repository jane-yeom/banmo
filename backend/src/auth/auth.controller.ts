// TODO: 이메일 로그인 - 현재 카카오 로그인만 지원
// 추후 필요시 register/login 주석 해제

import { Body, Controller, Get, HttpCode, Post, Query, UseGuards } from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './auth.dto';
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

  /** 이메일 회원가입 */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** 이메일 인증 */
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  /** 인증 메일 재발송 */
  @Post('resend-verify')
  @HttpCode(200)
  async resendVerify(@Body('email') email: string) {
    return this.authService.resendVerifyEmail(email);
  }

  /** 이메일 로그인 */
  @Post('login')
  @HttpCode(200)
  async emailLogin(@Body() dto: LoginDto) {
    return this.authService.emailLogin(dto);
  }

  /** 아이디 중복확인 */
  @Get('check-username')
  async checkUsername(@Query('username') username: string) {
    return this.authService.checkUsernameAvailability(username);
  }

  /** 일반 유저 비밀번호 찾기 (아이디 + 이메일) */
  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: { username: string; email: string }) {
    return this.authService.forgotPasswordUser(dto);
  }

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
