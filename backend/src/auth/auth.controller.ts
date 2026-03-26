import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { User } from '../users/user.entity';

class KakaoLoginDto {
  accessToken: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('kakao')
  async kakaoLogin(@Body() body: KakaoLoginDto) {
    return this.authService.kakaoLogin(body.accessToken);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@CurrentUser() user: User) {
    return user;
  }
}
