# 반모 (Banmo) - 반주의 모든것

반주자와 연주자를 연결하는 매칭 플랫폼

## 스택

| 영역 | 기술 |
|---|---|
| 프론트엔드 | Next.js 14, TypeScript, Tailwind CSS, Zustand, TanStack Query |
| 백엔드 | NestJS, TypeORM, PostgreSQL, Socket.io |
| 인증 | JWT, 카카오 OAuth, 이메일 인증 |
| 인프라 | Railway (DB), Vercel (FE), Cloudflare R2 (이미지) |

---

## 개발 환경 설정

### 사전 요구사항

- Node.js 18+
- PostgreSQL 16+
- npm

### 1. 의존성 설치

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. 로컬 DB 생성

PostgreSQL이 실행 중인 상태에서:

```bash
psql -U postgres -c "CREATE DATABASE banmo_dev;"
psql -U postgres -c "CREATE USER banmo_user WITH PASSWORD 'banmo1234';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE banmo_dev TO banmo_user;"
psql -U postgres -c "ALTER DATABASE banmo_dev OWNER TO banmo_user;"
```

### 3. 환경변수 설정

**백엔드** (`backend/.env.development` - 이미 생성됨):

```env
DATABASE_URL=postgresql://banmo_user:banmo1234@localhost:5432/banmo_dev
JWT_SECRET=banmo_dev_secret_key
JWT_EXPIRES_IN=7d
KAKAO_REST_API_KEY=0a7a79de08305d6ac37730199e6dcabc
KAKAO_CALLBACK_URL=http://localhost:3000/auth/callback
FRONTEND_URL=http://localhost:3000
```

**프론트엔드** (`frontend/.env.local` - 이미 생성됨):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_KAKAO_REST_API_KEY=0a7a79de08305d6ac37730199e6dcabc
```

### 4. 실행

#### 방법 A: 배치 파일 (Windows)

```
start-dev.bat 더블클릭
```

#### 방법 B: 터미널 직접 실행

```bash
# 터미널 1 - 백엔드
cd backend && npm run start:dev

# 터미널 2 - 프론트엔드
cd frontend && npm run dev
```

### 5. 접속

| 서비스 | URL |
|---|---|
| 프론트엔드 | http://localhost:3000 |
| 백엔드 API | http://localhost:3001 |
| 관리자 | http://localhost:3000/admin/login |

---

## 브랜치 전략

```
main  ─── 운영 (banmo.kr 자동 배포)
  └── dev ─── 개발 (테스트 후 main merge)
```

## 환경별 설정

| 환경 | 프론트 | 백엔드 | DB |
|---|---|---|---|
| 로컬 개발 | localhost:3000 | localhost:3001 | 로컬 PostgreSQL (banmo_dev) |
| 운영 | banmo.kr | api.banmo.kr | Railway PostgreSQL |

---

## 주요 스크립트

### 백엔드

```bash
npm run start:dev      # 개발 서버 (hot reload, .env.development 로드)
npm run start:prod     # 운영 서버 (.env 로드)
npm run build          # 빌드
npm run seed           # 시드 데이터 삽입
npm run seed:clear     # 시드 데이터 초기화
npm run create-admin   # 관리자 계정 생성
```

### 프론트엔드

```bash
npm run dev    # 개발 서버 (http://localhost:3000)
npm run build  # 빌드
npm run start  # 운영 서버
```

---

## 주요 기능

- 반주자/연주자 구인구직 (공고 등록/지원/채팅 자동 연결)
- 1:1 실시간 채팅 (Socket.io)
- 음표 신뢰도 등급 시스템 (16분음표 ~ 온음표)
- 키워드 알림 (등록한 키워드 포함 공고 자동 알림)
- 공연/연습실 홍보, 중고악기 거래
- 카카오 소셜 로그인 + 이메일 로그인
- FCM 웹 푸시 알림
- 관리자 페이지 (회원/공고/신고/QnA/결제 관리)

---

## 카카오 로그인 로컬 설정

카카오 개발자 콘솔(developers.kakao.com) → 앱 → 플랫폼 → Web에서
Redirect URI 등록 필요:

```
http://localhost:3000/auth/callback
```
