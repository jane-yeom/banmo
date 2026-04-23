import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as bcryptLib from 'bcrypt';
import { DataSource } from 'typeorm';
import { User, UserRole, NoteGrade, LoginType } from '../users/user.entity';
import { Post, PostCategory, PayType } from '../posts/post.entity';
import { Board, BoardType } from '../board/board.entity';
import { BoardComment } from '../board/board-comment.entity';
import { Qna, QnaCategory, QnaStatus } from '../admin/qna.entity';
import { Report, ReportTargetType, ReportReason, ReportStatus } from '../reports/report.entity';

// .env 수동 로드
function loadEnv() {
  const envPath = path.resolve(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key && !(key in process.env)) process.env[key] = val;
  }
}
loadEnv();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'banmo_user',
  password: process.env.DATABASE_PASSWORD || 'banmo_pass',
  database: process.env.DATABASE_NAME || 'banmo',
  entities: [User, Post, Board, BoardComment, Qna, Report],
  synchronize: false,
});

// ─────────────────────────────────────────────
// PostgreSQL enum 마이그레이션 (NONE→SIXTEENTH 등)
// ─────────────────────────────────────────────
async function migrateNoteGradeEnum(ds: DataSource) {
  await ds.query(`
    DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'NONE'
          AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'users_notegrade_enum')
      ) THEN
        ALTER TYPE users_notegrade_enum RENAME VALUE 'NONE'         TO 'SIXTEENTH';
        ALTER TYPE users_notegrade_enum RENAME VALUE 'BASIC'        TO 'EIGHTH';
        ALTER TYPE users_notegrade_enum RENAME VALUE 'INTERMEDIATE' TO 'QUARTER';
        ALTER TYPE users_notegrade_enum RENAME VALUE 'ADVANCED'     TO 'HALF';
        ALTER TYPE users_notegrade_enum RENAME VALUE 'PROFESSIONAL' TO 'WHOLE';
      END IF;
    END $$;
  `);
}

// ─────────────────────────────────────────────
// 메인 시드 실행
// ─────────────────────────────────────────────
async function seed() {
  console.log('🌱 시드 스크립트 시작...');

  await AppDataSource.initialize();
  console.log('✅ DB 연결 완료');

  // enum 마이그레이션 (구버전 → 음표 이름)
  await migrateNoteGradeEnum(AppDataSource);
  console.log('🔄 NoteGrade enum 마이그레이션 완료');

  // banReason 컬럼 추가 (없으면)
  await AppDataSource.query(`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'banReason'
      ) THEN
        ALTER TABLE users ADD COLUMN "banReason" text NULL;
      END IF;
    END $$;
  `);

  // qnas 테이블 생성 (없으면)
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS qnas (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      "authorId" uuid NULL REFERENCES users(id) ON DELETE SET NULL,
      "authorName" varchar NULL,
      "authorEmail" varchar NOT NULL,
      title varchar NOT NULL,
      content text NOT NULL,
      category varchar NOT NULL DEFAULT 'GENERAL',
      status varchar NOT NULL DEFAULT 'PENDING',
      answer text NULL,
      "answeredAt" timestamp NULL,
      "isPrivate" boolean NOT NULL DEFAULT true,
      "createdAt" timestamp NOT NULL DEFAULT now(),
      "updatedAt" timestamp NOT NULL DEFAULT now()
    );
  `);
  console.log('🗄️  스키마 마이그레이션 완료');

  const userRepo    = AppDataSource.getRepository(User);
  const postRepo    = AppDataSource.getRepository(Post);
  const boardRepo   = AppDataSource.getRepository(Board);
  const commentRepo = AppDataSource.getRepository(BoardComment);
  const qnaRepo     = AppDataSource.getRepository(Qna);
  const reportRepo  = AppDataSource.getRepository(Report);

  // ── 기존 QnA, Report 정리
  const testQnaUsers = ['pianist@banmo.com', 'violin@banmo.com', 'cello@banmo.com', 'flute@banmo.com'];
  for (const email of testQnaUsers) {
    const u = await userRepo.findOne({ where: { email } });
    if (u) {
      await qnaRepo.delete({ authorId: u.id });
      await reportRepo.delete({ reporterId: u.id });
    }
  }
  // 비회원 QnA 정리
  await qnaRepo.delete({ authorId: null as any });

  // ── 기존 테스트 데이터 정리
  const testEmails = [
    'pianist@banmo.com',
    'violin@banmo.com',
    'cello@banmo.com',
    'flute@banmo.com',
    'guitar@banmo.com',
  ];
  for (const email of testEmails) {
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
      // 댓글 → 게시글 → 공고 → 유저 순서로 삭제
      const boards = await boardRepo.find({ where: { authorId: existing.id } });
      for (const b of boards) {
        await commentRepo.delete({ boardId: b.id });
      }
      // 이 유저가 단 댓글도 삭제
      await commentRepo.delete({ authorId: existing.id });
      await boardRepo.delete({ authorId: existing.id });
      await postRepo.delete({ authorId: existing.id });
      await userRepo.delete({ id: existing.id });
    }
  }
  console.log('🧹 기존 테스트 데이터 정리 완료');

  // ── 관리자 계정 생성 (없으면)
  let adminUser = await userRepo.findOne({ where: { email: 'admin@banmo.com' } });
  if (!adminUser) {
    const adminPw = await bcryptLib.hash('admin1234!', 10);
    adminUser = userRepo.create({
      email:      'admin@banmo.com',
      password:   adminPw,
      nickname:   '관리자',
      role:       UserRole.ADMIN,
      loginType:  LoginType.EMAIL,
      noteGrade:  NoteGrade.WHOLE,
      trustScore: 999,
      instruments: [],
      videoUrls:   [],
    } as Partial<User>);
    adminUser = await userRepo.save(adminUser);
    console.log('👑 관리자 계정 생성 완료');
  } else {
    console.log('ℹ️  관리자 계정 이미 존재');
  }

  // ── 테스트 유저 5명 생성
  const pw = await bcryptLib.hash('test1234!', 10);

  const usersData: Partial<User>[] = [
    {
      email: 'pianist@banmo.com', nickname: '김피아노', password: pw,
      instruments: ['피아노'], region: '서울 강남구',
      noteGrade: NoteGrade.WHOLE, trustScore: 120,
      bio: '피아노 반주 경력 10년입니다. 성악, 기악 반주 전문입니다.',
      loginType: LoginType.EMAIL, videoUrls: [],
    },
    {
      email: 'violin@banmo.com', nickname: '이바이올린', password: pw,
      instruments: ['바이올린'], region: '서울 마포구',
      noteGrade: NoteGrade.HALF, trustScore: 65,
      bio: '음대 출신 바이올린 연주자입니다.',
      loginType: LoginType.EMAIL, videoUrls: [],
    },
    {
      email: 'cello@banmo.com', nickname: '박첼로', password: pw,
      instruments: ['첼로'], region: '경기 성남시',
      noteGrade: NoteGrade.QUARTER, trustScore: 35,
      bio: '첼로 레슨 및 연주 활동 중입니다.',
      loginType: LoginType.EMAIL, videoUrls: [],
    },
    {
      email: 'flute@banmo.com', nickname: '최플루트', password: pw,
      instruments: ['플루트'], region: '부산 해운대구',
      noteGrade: NoteGrade.EIGHTH, trustScore: 15,
      bio: '플루트 연주자 구직 중입니다.',
      loginType: LoginType.EMAIL, videoUrls: [],
    },
    {
      email: 'guitar@banmo.com', nickname: '정기타', password: pw,
      instruments: ['기타'], region: '대구 중구',
      noteGrade: NoteGrade.SIXTEENTH, trustScore: 0,
      bio: '기타 연주자입니다.',
      loginType: LoginType.EMAIL, videoUrls: [],
    },
  ];

  const savedUsers: User[] = [];
  for (const u of usersData) {
    const user = userRepo.create(u as Partial<User>);
    savedUsers.push(await userRepo.save(user));
  }
  console.log(`👥 유저 ${savedUsers.length}명 삽입 완료`);

  const [u1, u2, u3, u4, u5] = savedUsers;

  // ─────────────────────────────────────────────
  // 공고 25개
  // ─────────────────────────────────────────────
  const postsData: Partial<Post>[] = [
    // JOB_OFFER 5개
    {
      title: '성악 레슨 피아노 반주자 구합니다',
      content: '매주 화/목 오전 10시-12시 성악 레슨 반주자를 구합니다. 경력 3년 이상 선호합니다. 레퍼토리는 주로 이탈리아 가곡, 독일 가곡입니다.',
      category: PostCategory.JOB_OFFER, instruments: ['피아노'],
      region: '서울 강남구', payType: PayType.HOURLY, payMin: 20000, payMax: 30000,
      author: u2, authorId: u2.id,
    },
    {
      title: '바이올린 콩쿠르 반주자 급구',
      content: '다음달 콩쿠르 준비 중인 바이올리니스트입니다. 2주간 집중 연습 가능한 반주자 구합니다. 곡목은 브람스 소나타입니다.',
      category: PostCategory.JOB_OFFER, instruments: ['피아노'],
      region: '서울 서초구', payType: PayType.PER_SESSION, payMin: 80000, payMax: 150000,
      author: u3, authorId: u3.id, isPremium: true,
    },
    {
      title: '합창단 정기연주회 반주자 모집',
      content: 'OO합창단 정기연주회 반주자를 모집합니다. 연습은 매주 토요일 오후 2-5시입니다. 연주회는 12월 예정입니다.',
      category: PostCategory.JOB_OFFER, instruments: ['피아노'],
      region: '경기 수원시', payType: PayType.MONTHLY, payMin: 300000, payMax: 500000,
      author: u4, authorId: u4.id,
    },
    {
      title: '플루트 독주회 반주자 구합니다',
      content: '내년 봄 플루트 독주회를 준비 중입니다. 6개월간 함께하실 피아노 반주자를 구합니다. 레퍼토리 협의 가능합니다.',
      category: PostCategory.JOB_OFFER, instruments: ['피아노'],
      region: '부산 해운대구', payType: PayType.PER_SESSION, payMin: 100000, payMax: 200000,
      author: u5, authorId: u5.id,
    },
    {
      title: '방과후 음악 수업 반주자 구인',
      content: '초등학교 방과후 음악 수업 반주 도우미를 구합니다. 월-금 오후 2-4시, 장기 근무 가능하신 분 우대합니다.',
      category: PostCategory.JOB_OFFER, instruments: ['피아노'],
      region: '서울 노원구', payType: PayType.HOURLY, payMin: 15000, payMax: 20000,
      author: u1, authorId: u1.id,
    },

    // JOB_SEEK 5개
    {
      title: '피아노 반주 구직합니다 - 경력 10년',
      content: '음대 피아노과 졸업 후 10년간 반주 활동을 해왔습니다. 성악, 기악 모두 가능합니다. 강남/서초 지역 선호합니다.',
      category: PostCategory.JOB_SEEK, instruments: ['피아노'],
      region: '서울 강남구', payType: PayType.HOURLY, payMin: 25000, payMax: 40000,
      author: u1, authorId: u1.id,
    },
    {
      title: '바이올린 반주 전문 피아니스트 구직',
      content: '실내악 및 콩쿠르 반주 전문입니다. 주요 바이올린 소나타 레퍼토리 보유 중입니다. 단기/장기 모두 가능합니다.',
      category: PostCategory.JOB_SEEK, instruments: ['피아노', '바이올린'],
      region: '서울 마포구', payType: PayType.PER_SESSION, payMin: 80000, payMax: 150000,
      author: u2, authorId: u2.id,
    },
    {
      title: '첼로 레슨 반주 구직합니다',
      content: '첼로 전공자로 반주 및 레슨 도우미 활동을 원합니다. 수도권 어디든 이동 가능합니다.',
      category: PostCategory.JOB_SEEK, instruments: ['첼로', '피아노'],
      region: '경기 성남시', payType: PayType.HOURLY, payMin: 20000, payMax: 35000,
      author: u3, authorId: u3.id,
    },
    {
      title: '관악 앙상블 반주 및 코치 구직',
      content: '플루트 전공 후 관악 앙상블 코칭 및 반주 활동 희망합니다. 플루트, 오보에, 클라리넷 레퍼토리 다수 보유합니다.',
      category: PostCategory.JOB_SEEK, instruments: ['플루트'],
      region: '부산 해운대구', payType: PayType.PER_SESSION, payMin: 60000, payMax: 100000,
      author: u4, authorId: u4.id,
    },
    {
      title: '기타 앙상블 반주자 구직',
      content: '클래식 기타 전공입니다. 기타 이중주, 앙상블, 반주 활동 가능합니다. 대구/경북 지역 활동 선호합니다.',
      category: PostCategory.JOB_SEEK, instruments: ['기타'],
      region: '대구 중구', payType: PayType.HOURLY, payMin: 15000, payMax: 25000,
      author: u5, authorId: u5.id,
    },

    // LESSON_OFFER 5개
    {
      title: '피아노 레슨 선생님 구합니다 - 초급반',
      content: '7세 자녀 피아노 레슨 선생님을 구합니다. 주 2회 방문 레슨 가능하신 분. 바이엘/체르니 수준입니다.',
      category: PostCategory.LESSON_OFFER, instruments: ['피아노'],
      region: '서울 강남구', payType: PayType.HOURLY, payMin: 30000, payMax: 50000,
      author: u3, authorId: u3.id,
    },
    {
      title: '바이올린 레슨 선생님 급구 - 성인 초보',
      content: '성인 바이올린 입문자입니다. 주 1회 레슨 원합니다. 직장인이라 저녁 시간 또는 주말 가능한 선생님 선호합니다.',
      category: PostCategory.LESSON_OFFER, instruments: ['바이올린'],
      region: '서울 마포구', payType: PayType.HOURLY, payMin: 40000, payMax: 60000,
      author: u4, authorId: u4.id,
    },
    {
      title: '첼로 레슨 선생님 구인 - 중급',
      content: '첼로 3년차입니다. 좀 더 체계적으로 배우고 싶어서 새 선생님을 구합니다. 주 2회 레슨 희망합니다.',
      category: PostCategory.LESSON_OFFER, instruments: ['첼로'],
      region: '경기 성남시', payType: PayType.HOURLY, payMin: 50000, payMax: 70000,
      author: u5, authorId: u5.id,
    },
    {
      title: '플루트 레슨 선생님 구합니다',
      content: '중학생 자녀 플루트 레슨 선생님을 구합니다. 음대 준비 중이며 입시 경험 있는 선생님 선호합니다.',
      category: PostCategory.LESSON_OFFER, instruments: ['플루트'],
      region: '부산 해운대구', payType: PayType.HOURLY, payMin: 50000, payMax: 80000,
      author: u1, authorId: u1.id,
    },
    {
      title: '기타 레슨 구인 - 통기타 입문',
      content: '통기타 배우고 싶은 직장인입니다. 주 1회 레슨으로 시작하고 싶습니다. 강남역 근처 가능한 선생님 구합니다.',
      category: PostCategory.LESSON_OFFER, instruments: ['기타'],
      region: '서울 강남구', payType: PayType.HOURLY, payMin: 30000, payMax: 50000,
      author: u2, authorId: u2.id,
    },

    // PROMO_CONCERT 5개
    {
      title: '제5회 김피아노 피아노 독주회',
      content: '쇼팽 발라드, 리스트 소나타를 중심으로 한 피아노 독주회에 초대합니다. 일시: 2026년 5월 15일 오후 7시 30분. 장소: 예술의전당 리사이틀홀. 입장권: 2만원',
      category: PostCategory.PROMO_CONCERT, instruments: ['피아노'],
      region: '서울 서초구', payType: PayType.NEGOTIABLE, payMin: 0,
      author: u1, authorId: u1.id, isPremium: true,
    },
    {
      title: '봄날의 실내악 연주회',
      content: '피아노 트리오가 선보이는 봄 실내악 연주회입니다. 브람스, 슈만의 피아노 트리오를 연주합니다. 일시: 2026년 4월 20일. 장소: 마포아트센터. 무료 입장',
      category: PostCategory.PROMO_CONCERT, instruments: ['피아노', '바이올린', '첼로'],
      region: '서울 마포구', payType: PayType.NEGOTIABLE, payMin: 0,
      author: u2, authorId: u2.id,
    },
    {
      title: '졸업 독주회 - 첼로 소나타의 밤',
      content: '음대 졸업 독주회에 여러분을 초대합니다. 베토벤, 브람스 첼로 소나타를 연주합니다. 일시: 2026년 4월 30일 오후 6시. 장소: 예원학교 콘서트홀. 무료입장',
      category: PostCategory.PROMO_CONCERT, instruments: ['첼로'],
      region: '서울 종로구', payType: PayType.NEGOTIABLE, payMin: 0,
      author: u3, authorId: u3.id,
    },
    {
      title: '플루트와 피아노의 만남 - 듀오 리사이틀',
      content: '플루트와 피아노가 함께하는 아름다운 저녁에 초대합니다. 모차르트, 프랑크, 풀랑크의 작품을 연주합니다. 일시: 2026년 5월 2일 오후 7시. 입장권: 1만원',
      category: PostCategory.PROMO_CONCERT, instruments: ['플루트', '피아노'],
      region: '부산 해운대구', payType: PayType.NEGOTIABLE, payMin: 0,
      author: u4, authorId: u4.id,
    },
    {
      title: '기타 앙상블 정기연주회',
      content: 'OO기타앙상블 제3회 정기연주회입니다. 클래식 기타 앙상블의 매력을 느껴보세요. 일시: 2026년 5월 10일 오후 5시. 장소: 대구문화예술회관. 입장료 무료',
      category: PostCategory.PROMO_CONCERT, instruments: ['기타'],
      region: '대구 중구', payType: PayType.NEGOTIABLE, payMin: 0,
      author: u5, authorId: u5.id,
    },

    // TRADE_INSTRUMENT 5개
    {
      title: '야마하 그랜드피아노 C3X 판매합니다',
      content: '2018년 구입한 야마하 C3X 판매합니다. 사용감 적고 관리 잘 된 상품입니다. 조율 최근에 했습니다. 직거래만 가능합니다. 강남구 자택 방문 확인 가능합니다.',
      category: PostCategory.TRADE_INSTRUMENT, instruments: ['피아노'],
      region: '서울 강남구', payType: PayType.PER_SESSION, payMin: 15000000, payMax: 18000000,
      author: u1, authorId: u1.id,
    },
    {
      title: '독일제 바이올린 활 판매',
      content: '독일산 페르남부코 바이올린 활 판매합니다. 연주자 업그레이드로 인한 판매입니다. 상태 매우 좋습니다. 케이스 포함 판매합니다.',
      category: PostCategory.TRADE_INSTRUMENT, instruments: ['바이올린'],
      region: '서울 마포구', payType: PayType.PER_SESSION, payMin: 800000, payMax: 1000000,
      author: u2, authorId: u2.id,
    },
    {
      title: '첼로 4/4 사이즈 입문용 판매',
      content: '입문용 첼로 판매합니다. 활, 케이스, 송진 포함입니다. 3년 사용했으나 관리 잘 되어 있습니다. 업그레이드로 인한 판매입니다.',
      category: PostCategory.TRADE_INSTRUMENT, instruments: ['첼로'],
      region: '경기 성남시', payType: PayType.PER_SESSION, payMin: 300000, payMax: 400000,
      author: u3, authorId: u3.id,
    },
    {
      title: '야마하 플루트 YFL-222 판매',
      content: '야마하 입문용 플루트 판매합니다. 구매 후 1년 사용했습니다. 케이스, 클리닝 도구 포함입니다. 부산 직거래 또는 안전결제 가능합니다.',
      category: PostCategory.TRADE_INSTRUMENT, instruments: ['플루트'],
      region: '부산 해운대구', payType: PayType.PER_SESSION, payMin: 250000, payMax: 300000,
      author: u4, authorId: u4.id,
    },
    {
      title: '클래식 기타 알함브라 판매',
      content: '스페인산 클래식 기타 판매합니다. 음색이 매우 아름다운 기타입니다. 하드케이스 포함. 대구 직거래 선호합니다.',
      category: PostCategory.TRADE_INSTRUMENT, instruments: ['기타'],
      region: '대구 중구', payType: PayType.PER_SESSION, payMin: 500000, payMax: 700000,
      author: u5, authorId: u5.id,
    },
  ];

  let postCount = 0;
  for (const p of postsData) {
    const post = postRepo.create(p as Partial<Post>);
    await postRepo.save(post);
    postCount++;
  }
  console.log(`📋 공고 ${postCount}개 삽입 완료`);

  // ─────────────────────────────────────────────
  // 게시판 글 13개 (FREE 5, ANONYMOUS 5, NOTICE 3)
  // ─────────────────────────────────────────────
  const boardsData: Partial<Board>[] = [
    // FREE 5개
    {
      type: BoardType.FREE, title: '반주자 구할 때 유의사항 공유해요',
      content: '반주자를 구하면서 겪었던 경험을 공유합니다. 페이는 꼭 미리 협의하시고, 악보는 최소 2주 전에 전달해주세요. 연습 횟수와 본 연주 횟수도 명확히 해두시면 좋습니다. 서로 존중하는 문화가 만들어지길 바랍니다.',
      author: u1, authorId: u1.id,
    },
    {
      type: BoardType.FREE, title: '반주 페이 어느 정도가 적당할까요?',
      content: '콩쿠르 반주 1회당 페이가 보통 얼마 정도 되나요? 처음 구하는 거라 기준을 모르겠어요. 레퍼토리는 바이올린 소나타 1곡입니다. 연습 3회, 본 연주 1회 예정입니다.',
      author: u3, authorId: u3.id,
    },
    {
      type: BoardType.FREE, title: '악보 저작권 관련해서 아시는 분?',
      content: '연주회에서 현대 작곡가 곡을 연주하려는데 악보 저작권 문제가 있을까요? 어디서 정식 악보를 구해야 하는지 아시는 분 도움 부탁드립니다.',
      author: u2, authorId: u2.id,
    },
    {
      type: BoardType.FREE, title: '반모 플랫폼 사용 후기',
      content: '반모 플랫폼 통해서 반주자 구했어요! 생각보다 빨리 구해서 너무 좋았습니다. 앞으로 더 많은 분들이 이용하셨으면 좋겠어요. 개발자분들 감사합니다 :)',
      author: u4, authorId: u4.id,
    },
    {
      type: BoardType.FREE, title: '연습실 추천해주세요 - 강남 근처',
      content: '강남/서초 근처에 피아노 연습실 추천해주실 분 계신가요? 그랜드 피아노 있는 곳이면 더 좋겠습니다. 시간당 가격도 알려주시면 감사하겠습니다.',
      author: u5, authorId: u5.id,
    },

    // ANONYMOUS 5개
    {
      type: BoardType.ANONYMOUS, isAnonymous: true,
      title: '페이 너무 낮게 부르는 분들 때문에 힘드네요',
      content: '콩쿠르 반주인데 5만원 제시하시는 분들이 너무 많아요. 악보 받고 연습하는 시간만 해도 최소 몇 시간인데... 제발 적정 페이 주세요 ㅠㅠ',
      author: u2, authorId: u2.id,
    },
    {
      type: BoardType.ANONYMOUS, isAnonymous: true,
      title: '반주 거절당했는데 상처받았어요',
      content: '콩쿠르 반주 지원했는데 다른 분으로 정했다고 연락이 왔어요. 거절 자체는 이해하는데 너무 늦게 연락 주셔서 다른 스케줄도 다 비워뒀는데 속상하네요.',
      author: u3, authorId: u3.id,
    },
    {
      type: BoardType.ANONYMOUS, isAnonymous: true,
      title: '악보를 당일에 주는 경우도 있나요?',
      content: '오늘 연락 와서 내일 반주 가능하냐고 하시는데... 이런 경우 어떻게 대응하시나요? 거절하는 게 맞을까요?',
      author: u4, authorId: u4.id,
    },
    {
      type: BoardType.ANONYMOUS, isAnonymous: true,
      title: '선생님께 반주 부탁하기 너무 어려워요',
      content: '개인 레슨 선생님께 콩쿠르 반주도 부탁드렸는데 페이 얘기를 어떻게 꺼내야 할지 모르겠어요. 그냥 당연히 해주실 줄 알고 계신 것 같아서...',
      author: u1, authorId: u1.id,
    },
    {
      type: BoardType.ANONYMOUS, isAnonymous: true,
      title: '반주비 안 주는 경우 어떻게 하셨나요',
      content: '연주회 끝나고 반주비 안 주시는 분 만났어요. 연락도 안 받으시고... 법적으로 어떻게 해야 할지 모르겠어요. 비슷한 경험 있으신 분 계신가요?',
      author: u5, authorId: u5.id,
    },

    // NOTICE 3개 (관리자 작성)
    {
      type: BoardType.NOTICE,
      title: '반모 플랫폼 오픈 안내',
      content: '안녕하세요. 반주자 매칭 플랫폼 반모가 오픈했습니다. 반모는 반주자와 연주자를 연결하는 플랫폼으로, 반주자의 처우 개선을 목표로 합니다. 많은 이용 부탁드립니다.',
      author: adminUser, authorId: adminUser.id,
    },
    {
      type: BoardType.NOTICE,
      title: '페이 최저 기준 정책 안내',
      content: '반모는 반주자 처우 개선을 위해 시급 기준 최저시급(10,030원) 이하의 공고 등록을 제한합니다. 적정 페이 문화 정착을 위해 협조 부탁드립니다.',
      author: adminUser, authorId: adminUser.id,
    },
    {
      type: BoardType.NOTICE,
      title: '음표 신뢰도 등급 시스템 안내',
      content: '반모는 안전한 거래를 위해 음표 신뢰도 등급 시스템을 운영합니다. 16분음표(신규)부터 온음표(최고신뢰)까지 활동에 따라 등급이 올라갑니다. 신고 누적 시 등급이 내려갈 수 있습니다.',
      author: adminUser, authorId: adminUser.id,
    },
  ];

  const savedBoards: Board[] = [];
  for (const b of boardsData) {
    const board = boardRepo.create(b as Partial<Board>);
    savedBoards.push(await boardRepo.save(board));
  }
  const boardCount = savedBoards.length;
  console.log(`📝 게시글 ${boardCount}개 삽입 완료`);

  // ─────────────────────────────────────────────
  // 댓글 15개 (자유게시판 5개에 3개씩)
  // ─────────────────────────────────────────────
  // FREE 게시글: savedBoards[0..4]
  const [b1, b2, b3, b4, b5] = savedBoards;

  const commentsData: Partial<BoardComment>[] = [
    // board1 댓글
    { board: b1, boardId: b1.id, author: u2, authorId: u2.id, content: '정말 공감해요. 악보 미리 주는 게 기본 예의인데 당일날 주시는 분들도 계시더라고요.' },
    { board: b1, boardId: b1.id, author: u3, authorId: u3.id, content: '페이 협의도 중요하지만 연습 횟수 합의도 꼭 필요한 것 같아요. 좋은 글 감사합니다!' },
    { board: b1, boardId: b1.id, author: u4, authorId: u4.id, content: '저도 비슷한 경험 있어요. 서로 배려하는 문화가 만들어졌으면 좋겠네요.' },

    // board2 댓글
    { board: b2, boardId: b2.id, author: u1, authorId: u1.id, content: '콩쿠르 반주는 보통 연습 1회당 5-8만원, 본 연주 10-15만원 정도 드립니다.' },
    { board: b2, boardId: b2.id, author: u4, authorId: u4.id, content: '곡의 난이도와 반주자 경력에 따라 다르긴 한데 그게 일반적인 것 같아요.' },
    { board: b2, boardId: b2.id, author: u5, authorId: u5.id, content: '처음이시면 주변 선생님들께 여쭤보시는 것도 좋을 것 같아요!' },

    // board3 댓글
    { board: b3, boardId: b3.id, author: u1, authorId: u1.id, content: 'IMSLP에서 퍼블릭 도메인 악보 찾아보세요. 현대곡은 출판사에 직접 문의하셔야 해요.' },
    { board: b3, boardId: b3.id, author: u5, authorId: u5.id, content: '음악저작권협회에 문의해보시는 것도 방법입니다.' },
    { board: b3, boardId: b3.id, author: u3, authorId: u3.id, content: '현대 작곡가 곡은 작곡가에게 직접 허락 받는 경우도 있어요.' },

    // board4 댓글
    { board: b4, boardId: b4.id, author: u2, authorId: u2.id, content: '저도 좋은 반주자 분 만났어요! 플랫폼 너무 유용하네요.' },
    { board: b4, boardId: b4.id, author: u3, authorId: u3.id, content: '반모 화이팅! 더 많은 기능 추가되면 좋겠어요 :)' },
    { board: b4, boardId: b4.id, author: u5, authorId: u5.id, content: '저도 곧 써봐야겠어요. 좋은 후기 감사합니다!' },

    // board5 댓글
    { board: b5, boardId: b5.id, author: u1, authorId: u1.id, content: '강남역 2번 출구 근처에 OO연습실 추천해요. 그랜드 피아노 있고 시간당 15000원이에요.' },
    { board: b5, boardId: b5.id, author: u2, authorId: u2.id, content: '서초동에 있는 XX연습실도 좋아요. 예약 시스템이 편리해요.' },
    { board: b5, boardId: b5.id, author: u4, authorId: u4.id, content: '저도 연습실 찾고 있었는데 좋은 정보 감사해요!' },
  ];

  let commentCount = 0;
  for (const c of commentsData) {
    const comment = commentRepo.create(c as Partial<BoardComment>);
    await commentRepo.save(comment);
    commentCount++;
  }
  console.log(`💬 댓글 ${commentCount}개 삽입 완료`);

  // ─────────────────────────────────────────────
  // QnA 5개
  // ─────────────────────────────────────────────
  const qnasData: Partial<Qna>[] = [
    {
      title: '반주 페이 기준이 궁금합니다',
      content: '반주 페이 기준이 어떻게 되는지 궁금합니다. 콩쿠르 반주나 연주회 반주 페이의 일반적인 기준을 알고 싶습니다.',
      category: QnaCategory.GENERAL,
      authorId: u1.id,
      authorEmail: u1.email,
      authorName: u1.nickname,
      isPrivate: false,
    },
    {
      title: '허위 공고 신고하고 싶어요',
      content: '반주 구인 공고인데 실제로 연락해보니 조건이 완전히 달랐습니다. 허위 공고를 어떻게 신고하면 되나요?',
      category: QnaCategory.REPORT,
      authorId: u2.id,
      authorEmail: u2.email,
      authorName: u2.nickname,
      isPrivate: true,
    },
    {
      title: '계정 비밀번호를 잊어버렸어요',
      content: '반모 계정 비밀번호를 잊어버렸는데 이메일 인증을 통한 비밀번호 재설정이 가능한가요?',
      category: QnaCategory.ACCOUNT,
      authorId: undefined,
      authorEmail: 'test@test.com',
      authorName: '비회원',
      isPrivate: true,
    },
    {
      title: '반주비 미지급 피해 당했어요',
      content: '연주회 반주를 완료했는데 상대방이 연락을 끊고 반주비를 지급하지 않습니다. 어떻게 도움을 받을 수 있나요?',
      category: QnaCategory.PAY,
      authorId: u3.id,
      authorEmail: u3.email,
      authorName: u3.nickname,
      isPrivate: true,
    },
    {
      title: '앱 오류 신고합니다',
      content: '공고 등록 시 이미지 업로드가 계속 실패합니다. 오류 메시지: "업로드에 실패했습니다". 해결 방법을 알려주세요.',
      category: QnaCategory.ETC,
      authorId: u4.id,
      authorEmail: u4.email,
      authorName: u4.nickname,
      isPrivate: false,
    },
  ];

  let qnaCount = 0;
  for (const q of qnasData) {
    const qna = qnaRepo.create(q as Partial<Qna>);
    await qnaRepo.save(qna);
    qnaCount++;
  }
  console.log(`❓ QnA ${qnaCount}개 삽입 완료`);

  // ─────────────────────────────────────────────
  // 신고 3개
  // ─────────────────────────────────────────────
  // 이미 신고가 있으면 스킵
  const existingReports = await reportRepo.count();
  if (existingReports === 0) {
    // 공고 중 첫 번째 것 찾기
    const [firstPost] = await postRepo.find({ order: { createdAt: 'ASC' }, take: 1 });
    const [secondPost] = await postRepo.find({
      where: { authorId: u3.id },
      order: { createdAt: 'ASC' },
      take: 1,
    });

    const reportsData: Partial<Report>[] = [
      {
        reporterId: u1.id,
        targetType: ReportTargetType.USER,
        targetId: u5.id,
        reason: ReportReason.FRAUD,
        description: '반주비를 지급하지 않고 연락을 끊었습니다.',
        status: ReportStatus.PENDING,
      },
      ...(firstPost ? [{
        reporterId: u2.id,
        targetType: ReportTargetType.POST,
        targetId: firstPost.id,
        reason: ReportReason.PRICE,
        description: '공고에 명시된 페이와 실제 제시 금액이 다릅니다.',
        status: ReportStatus.PENDING,
      } as Partial<Report>] : []),
      ...(secondPost ? [{
        reporterId: u3.id,
        targetType: ReportTargetType.POST,
        targetId: secondPost.id,
        reason: ReportReason.FAKE,
        description: '존재하지 않는 공연에 대한 허위 공고입니다.',
        status: ReportStatus.PENDING,
      } as Partial<Report>] : []),
    ];

    for (const r of reportsData) {
      const report = reportRepo.create(r as Partial<Report>);
      await reportRepo.save(report);
    }
    console.log(`🚨 신고 ${reportsData.length}개 삽입 완료`);
  } else {
    console.log(`ℹ️  신고 데이터 이미 존재 (${existingReports}건)`);
  }

  // ── 최종 카운트 출력
  const userCount  = await userRepo.count();
  const totalPost  = await postRepo.count();
  const totalBoard = await boardRepo.count();
  const totalComment = await commentRepo.count();

  await AppDataSource.destroy();

  console.log('\n🎵 시드 완료!');
  console.log(`유저: ${userCount}`);
  console.log(`공고: ${totalPost}`);
  console.log(`게시글: ${totalBoard}`);
  console.log(`댓글: ${totalComment}`);
}

// ─────────────────────────────────────────────
// DB 초기화 (admin 계정 제외 전체 삭제)
// ─────────────────────────────────────────────
async function seedClear() {
  console.log('🗑️  DB 초기화 시작 (admin 계정 제외)...');

  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USER || 'banmo_user',
    password: process.env.DATABASE_PASSWORD || 'banmo_pass',
    database: process.env.DATABASE_NAME || 'banmo',
    entities: [User, Post, Board, BoardComment],
    synchronize: false,
  });

  await ds.initialize();
  console.log('✅ DB 연결 완료');

  await ds.query(`DELETE FROM board_comments`);
  console.log('  🧹 board_comments 삭제 완료');

  await ds.query(`DELETE FROM chat_messages`);
  console.log('  🧹 chat_messages 삭제 완료');

  await ds.query(`DELETE FROM applications`);
  console.log('  🧹 applications 삭제 완료');

  await ds.query(`DELETE FROM qnas`);
  console.log('  🧹 qnas 삭제 완료');

  await ds.query(`DELETE FROM reports`);
  console.log('  🧹 reports 삭제 완료');

  await ds.query(`DELETE FROM payments`);
  console.log('  🧹 payments 삭제 완료');

  await ds.query(`DELETE FROM chat_rooms`);
  console.log('  🧹 chat_rooms 삭제 완료');

  await ds.query(`DELETE FROM boards`);
  console.log('  🧹 boards 삭제 완료');

  await ds.query(`DELETE FROM posts`);
  console.log('  🧹 posts 삭제 완료');

  await ds.query(`DELETE FROM users WHERE role != 'ADMIN'`);
  console.log('  🧹 users 삭제 완료 (admin 계정 유지)');

  await ds.destroy();
  console.log('\n✅ DB 초기화 완료! admin 계정만 유지됩니다.');
}

// ─────────────────────────────────────────────
// 관리자 계정 생성
// ─────────────────────────────────────────────
async function seedAdmin() {
  console.log('👑 관리자 계정 생성 시작...');

  await AppDataSource.initialize();
  console.log('✅ DB 연결 완료');

  const userRepo = AppDataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: 'admin@banmo.com' } });
  if (existing) {
    console.log('ℹ️  이미 관리자 계정이 존재합니다. (admin@banmo.com)');
    await AppDataSource.destroy();
    return;
  }

  const hashed = await bcryptLib.hash('admin1234!', 10);
  const admin = userRepo.create({
    email: 'admin@banmo.com',
    password: hashed,
    nickname: '관리자',
    role: UserRole.ADMIN,
    loginType: LoginType.EMAIL,
    noteGrade: NoteGrade.WHOLE,
    trustScore: 999,
    instruments: [],
    videoUrls: [],
  } as unknown as User);
  await userRepo.save(admin);

  await AppDataSource.destroy();
  console.log('✅ 관리자 계정 생성 완료!');
  console.log('   이메일: admin@banmo.com');
  console.log('   비밀번호: admin1234!');
}

const args = process.argv.slice(2);
if (args.includes('--clear')) {
  seedClear().catch((err) => {
    console.error('❌ DB 초기화 실패:', err);
    process.exit(1);
  });
} else if (args.includes('--admin')) {
  seedAdmin().catch((err) => {
    console.error('❌ 관리자 생성 실패:', err);
    process.exit(1);
  });
} else {
  seed().catch((err) => {
    console.error('❌ 시드 실패:', err);
    process.exit(1);
  });
}
