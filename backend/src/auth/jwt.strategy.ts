import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  sub: string;
  email?: string;
  role?: string;
  kakaoId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET')!,
    });
  }

  async validate(payload: JwtPayload) {
    console.log('[JWT] payload 검증:', { sub: payload.sub, email: payload.email, role: payload.role });
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      console.warn('[JWT] 유저 없음 - sub:', payload.sub);
      throw new UnauthorizedException('유저를 찾을 수 없습니다.');
    }
    if (user.isBanned) {
      console.warn('[JWT] 밴된 유저:', payload.sub);
      throw new UnauthorizedException('이용이 제한된 계정입니다.');
    }
    return user;
  }
}
