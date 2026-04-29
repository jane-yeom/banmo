# 반모 (반주의 모든것)

반주자와 연주자를 연결하는 매칭 플랫폼

## 기술 스택

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand
- **Backend**: NestJS, TypeScript, TypeORM
- **Database**: PostgreSQL, Redis
- **Realtime**: Socket.io

## 로컬 개발 환경 세팅

### 필수 설치

- Node.js 20+
- pnpm
- PostgreSQL 16
- Redis (Memurai)

### 실행 방법

1. 환경변수 설정: `.env.example` 참고하여 `backend/.env` 생성
2. 백엔드: `cd backend && pnpm install && pnpm run start:dev`
3. 프론트엔드: `cd frontend && pnpm install && pnpm run dev`

### 관리자 계정 (로컬)

- 이메일: `admin@banmo.com`
- 비밀번호: `admin1234!`

## 주요 기능

- 반주자/연주자 구인구직
- 1:1 실시간 채팅 (Socket.io)
- 음표 신뢰도 등급 시스템 (16분음표~온음표)
- 페이 최저 기준 validation (최저시급 이하 차단)
- 공연/연습실 홍보
- 중고악기 거래
- 고객센터 (FAQ / 문의하기 / 공지사항)
- 관리자 페이지 (회원/공고/신고/QnA/결제 관리)
- 푸시알림 (FCM + Socket.io)
- 카카오 소셜 로그인
