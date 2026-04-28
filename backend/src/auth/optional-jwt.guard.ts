import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  // 인증 실패해도 예외 던지지 않고 req.user = null 처리
  handleRequest(err: any, user: any) {
    return user || null;
  }

  // canActivate도 오버라이드해서 토큰 없어도 통과
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // 토큰 없거나 만료돼도 무시
    }
    return true;
  }
}
