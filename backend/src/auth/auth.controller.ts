import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, RegisterDto, EmailLoginDto } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { User } from '../users/user.entity';

class KakaoLoginDto {
  accessToken: string;
}

class KakaoCallbackDto {
  code: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 이메일 회원가입 */
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  /** 이메일 로그인 */
  @Post('login')
  async emailLogin(@Body() dto: EmailLoginDto) {
    return this.authService.emailLogin(dto);
  }

  /** 카카오 AccessToken 방식 (팝업) */
  @Post('kakao')
  async kakaoLogin(@Body() body: KakaoLoginDto) {
    return this.authService.kakaoLogin(body.accessToken);
  }

  /** 카카오 Authorization Code 방식 (리다이렉트 콜백) */
  @Post('kakao/callback')
  async kakaoCallback(@Body() body: KakaoCallbackDto) {
    return this.authService.kakaoLoginByCode(body.code);
  }

  /** 현재 유저 정보 */
  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
