import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
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

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async kakaoLogin(accessToken: string): Promise<{ accessToken: string; user: User; isNewUser: boolean }> {
    const kakaoUser = await this.getKakaoUserInfo(accessToken);

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
