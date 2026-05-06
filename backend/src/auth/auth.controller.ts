// TODO: 이메일 로그인 - 현재 카카오 로그인만 지원
// 추후 필요시 register/login 주석 해제

import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { IsString } from 'class-validator';
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // TODO: 이메일 로그인 - 추후 필요시 주석 해제
  // /** 이메일 회원가입 */
  // @Post('register')
  // async register(@Body() dto: RegisterDto) {
  //   return this.authService.register(dto);
  // }

  // /** 이메일 로그인 */
  // @Post('login')
  // @HttpCode(200)
  // async emailLogin(@Body() dto: LoginDto) {
  //   return this.authService.emailLogin(dto);
  // }

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

  /** 현재 유저 정보 */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
