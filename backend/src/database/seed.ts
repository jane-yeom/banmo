import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import { DataSource } from 'typeorm';
import { User } from '../users/user.entity';
import { Post, PostCategory, PayType, PostStatus } from '../posts/post.entity';
import { Board, BoardType } from '../board/board.entity';

// .env 수동 로드 (dotenv 미설치 환경 대비)
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
  entities: [User, Post, Board],
  synchronize: false,
});

// ─────────────────────────────────────────────
// 샘플 데이터 정의
// ─────────────────────────────────────────────

const SAMPLE_USERS = [
  {
    kakaoId: 'test_001',
    nickname: '김지은',
    email: 'jieun.kim@test.com',
    bio: '피아노 전공 10년 경력 반주자입니다. 성악·기악 반주 전문이며 초견에 자신있습니다.',
    region: '서울 강남구',
    instruments: ['피아노'],
    noteGrade: 'PROFESSIONAL',
    trustScore: 120,
  },
  {
    kakaoId: 'test_002',
    nickname: '이민준',
    email: 'minjun.lee@test.com',
    bio: '바이올린 연주 7년차. 실내악·독주 반주 가능합니다.',
    region: '서울 마포구',
    instruments: ['바이올린'],
    noteGrade: 'ADVANCED',
    trustScore: 65,
  },
  {
    kakaoId: 'test_003',
    nickname: '박서연',
    email: 'seoyeon.park@test.com',
    bio: '첼로 연주자. 협주곡 반주 및 실내악 경험 다수.',
    region: '경기 성남시',
    instruments: ['첼로'],
    noteGrade: 'INTERMEDIATE',
    trustScore: 35,
  },
  {
    kakaoId: 'test_004',
    nickname: '최도현',
    email: 'dohyun.choi@test.com',
    bio: '플루트 연주자. 목관 실내악 전문.',
    region: '부산 해운대구',
    instruments: ['플루트'],
    noteGrade: 'BASIC',
    trustScore: 15,
  },
  {
    kakaoId: 'test_005',
    nickname: '정수아',
    email: 'sua.jung@test.com',
    bio: '기타 연주자. 클래식·재즈 장르 모두 가능합니다.',
    region: '대구 중구',
    instruments: ['기타'],
    noteGrade: 'NONE',
    trustScore: 0,
  },
];

function makePosts(users: User[]): Partial<Post>[] {
  const u = users;

  const jobOffers: Partial<Post>[] = [
    { title: '피아노 반주자 구합니다 - 성악 레슨용', content: '성악 레슨 학원에서 주 3회 반주자를 모집합니다. 클래식 성악 반주 경험자 우대. 악보 초견 필수.', category: PostCategory.JOB_OFFER, instruments: ['피아노'], region: '서울 강남구', payType: PayType.HOURLY, payMin: 25000, author: u[0], authorId: u[0].id, isPremium: true },
    { title: '바이올린 반주 급구 - 콩쿨 준비생', content: '콩쿨 준비 중인 바이올린 학생의 반주자를 급히 구합니다. 3주 집중 레슨 반주 가능하신 분.', category: PostCategory.JOB_OFFER, instruments: ['바이올린', '피아노'], region: '서울 서초구', payType: PayType.PER_SESSION, payMin: 80000, author: u[1], authorId: u[1].id, isPremium: true },
    { title: '합창단 정기연주회 반주자 모집', content: '시민 합창단 정기연주회 반주를 맡아주실 분을 찾습니다. 합창 반주 경험 5년 이상 우대.', category: PostCategory.JOB_OFFER, instruments: ['피아노'], region: '서울 종로구', payType: PayType.PER_SESSION, payMin: 150000, author: u[0], authorId: u[0].id, isPremium: true },
    { title: '교회 주일 예배 반주자 모집', content: '강남구 소재 교회에서 주일 오전 예배 반주자를 모집합니다. CCM 및 찬송가 반주 가능자.', category: PostCategory.JOB_OFFER, instruments: ['피아노'], region: '서울 강남구', payType: PayType.MONTHLY, payMin: 400000, author: u[2], authorId: u[2].id },
    { title: '피아노 발표회 반주자 구합니다', content: '피아노 학원 연말 발표회 반주자 모집. 학생 레벨: 체르니 30~100 수준. 1일 행사.', category: PostCategory.JOB_OFFER, instruments: ['피아노'], region: '경기 성남시', payType: PayType.PER_SESSION, payMin: 200000, author: u[2], authorId: u[2].id },
    { title: '뮤지컬 오디션 반주자 구합니다', content: '뮤지컬 오디션 반주 가능한 분 구합니다. 팝·재즈·클래식 다양한 장르 반주 가능자 우대.', category: PostCategory.JOB_OFFER, instruments: ['피아노'], region: '서울 마포구', payType: PayType.HOURLY, payMin: 30000, author: u[1], authorId: u[1].id },
    { title: '성인 바이올린 반주자 모집', content: '성인 취미 바이올린 레슨 반주자 모집. 주 2회, 저녁 시간대. 클래식 소품 위주.', category: PostCategory.JOB_OFFER, instruments: ['바이올린'], region: '경기 수원시', payType: PayType.HOURLY, payMin: 20000, author: u[3], authorId: u[3].id },
    { title: '첼로 앙상블 피아니스트 모집', content: '아마추어 첼로 앙상블 팀에서 피아니스트를 구합니다. 월 2회 합주, 친목 위주 팀.', category: PostCategory.JOB_OFFER, instruments: ['첼로', '피아노'], region: '부산 해운대구', payType: PayType.PER_SESSION, payMin: 50000, author: u[3], authorId: u[3].id },
    { title: '플루트 소나타 반주 모집', content: '플루트 소나타 반주 전문가 구합니다. 바흐, 헨델, 텔레만 등 바로크 레퍼토리 위주.', category: PostCategory.JOB_OFFER, instruments: ['플루트', '피아노'], region: '대구 중구', payType: PayType.HOURLY, payMin: 35000, author: u[4], authorId: u[4].id },
    { title: '기타 이중주 파트너 모집', content: '클래식 기타 이중주 파트너 구합니다. 장르: 클래식·보사노바. 주 1회 합주 예정.', category: PostCategory.JOB_OFFER, instruments: ['기타'], region: '인천 연수구', payType: PayType.NEGOTIABLE, payMin: 0, author: u[4], authorId: u[4].id },
  ];

  const jobSeeks: Partial<Post>[] = [
    { title: '피아노 전공 반주 구직합니다', content: '음대 피아노 전공 졸업. 성악·기악 반주 5년 경력. 강남·서초 지역 선호. 포트폴리오 제공 가능.', category: PostCategory.JOB_SEEK, instruments: ['피아노'], region: '서울 강남구', payType: PayType.PER_SESSION, payMin: 80000, author: u[0], authorId: u[0].id },
    { title: '경력 5년 바이올린 반주자 구직', content: '예고·음대 출신 바이올린 연주자. 협주곡·소나타 반주 전문. 콩쿨 반주 경험 다수.', category: PostCategory.JOB_SEEK, instruments: ['바이올린', '피아노'], region: '서울 마포구', payType: PayType.PER_SESSION, payMin: 100000, author: u[1], authorId: u[1].id },
    { title: '첼로 전공 반주 구직합니다', content: '현재 대학원 재학 중. 첼로·피아노 실내악 반주 가능. 주말·저녁 시간 가능.', category: PostCategory.JOB_SEEK, instruments: ['첼로'], region: '경기 성남시', payType: PayType.PER_SESSION, payMin: 70000, author: u[2], authorId: u[2].id },
    { title: '찬양 반주 전문 구직합니다', content: '교회 반주 7년 경력. CCM·찬송가 모두 가능. 즉흥 반주 및 편곡 능숙.', category: PostCategory.JOB_SEEK, instruments: ['피아노'], region: '서울 전지역', payType: PayType.MONTHLY, payMin: 500000, author: u[0], authorId: u[0].id },
    { title: '플루트 레슨 반주 구직', content: '플루트 연주자이며 피아노 반주도 가능합니다. 목관 악기 레슨 반주 전문.', category: PostCategory.JOB_SEEK, instruments: ['플루트'], region: '부산 해운대구', payType: PayType.HOURLY, payMin: 25000, author: u[3], authorId: u[3].id },
    { title: '재즈 피아니스트 세션 구직', content: '재즈 피아노 전공. 클럽·카페 세션 경험 다수. 즉흥 연주 및 반주 모두 가능.', category: PostCategory.JOB_SEEK, instruments: ['피아노'], region: '서울 홍대', payType: PayType.PER_SESSION, payMin: 120000, author: u[4], authorId: u[4].id },
    { title: '기타 세션 구직합니다', content: '클래식·포크·재즈 기타 가능. 스튜디오 세션 및 공연 반주 경험 보유.', category: PostCategory.JOB_SEEK, instruments: ['기타'], region: '대구·경북 전지역', payType: PayType.PER_SESSION, payMin: 80000, author: u[4], authorId: u[4].id },
    { title: '성악 반주 전문 피아니스트 구직', content: '성악 전공 반주 피아니스트. 이탈리아어·독일어·한국가곡 레퍼토리 보유. 딕션 코치 가능.', category: PostCategory.JOB_SEEK, instruments: ['피아노'], region: '서울 강서구', payType: PayType.PER_SESSION, payMin: 90000, author: u[0], authorId: u[0].id },
    { title: '오케스트라 피아노 파트 구직', content: '오케스트라 피아노·첼레스타 파트 연주 가능. 오케스트라 경험 3년. 악보 초견 능숙.', category: PostCategory.JOB_SEEK, instruments: ['피아노'], region: '경기 전지역', payType: PayType.PER_SESSION, payMin: 150000, author: u[2], authorId: u[2].id },
    { title: '방과후 음악 교사 겸 반주 구직', content: '초등학교 방과후 피아노 교사 및 학교 행사 반주 가능. 교원자격증 보유.', category: PostCategory.JOB_SEEK, instruments: ['피아노'], region: '경기 수원시', payType: PayType.HOURLY, payMin: 35000, author: u[2], authorId: u[2].id },
  ];

  const lessonOffers: Partial<Post>[] = [
    { title: '피아노 레슨 선생님 구합니다 - 초등생', content: '초등학교 3학년 자녀 피아노 레슨 선생님 구합니다. 바이엘~체르니 30 수준. 방문 레슨 가능하신 분.', category: PostCategory.LESSON_OFFER, instruments: ['피아노'], region: '서울 강남구', payType: PayType.HOURLY, payMin: 30000, author: u[0], authorId: u[0].id },
    { title: '바이올린 초급 레슨 선생님 급구', content: '성인 취미 바이올린 레슨 선생님 급히 구합니다. 초보자 지도 경험 있는 분.', category: PostCategory.LESSON_OFFER, instruments: ['바이올린'], region: '서울 마포구', payType: PayType.HOURLY, payMin: 35000, author: u[1], authorId: u[1].id },
    { title: '첼로 레슨 선생님 모집', content: '중학생 첼로 레슨 선생님 모집. 스즈키 메소드 또는 경험 있는 분 우대. 주 2회.', category: PostCategory.LESSON_OFFER, instruments: ['첼로'], region: '경기 성남시', payType: PayType.HOURLY, payMin: 40000, author: u[2], authorId: u[2].id },
    { title: '플루트 레슨 교사 구합니다', content: '플루트 레슨 교사 모집. 초급자 위주. 음악 전공자 우대.', category: PostCategory.LESSON_OFFER, instruments: ['플루트'], region: '부산 해운대구', payType: PayType.HOURLY, payMin: 25000, author: u[3], authorId: u[3].id },
    { title: '기타 레슨 선생님 모집 (클래식)', content: '클래식 기타 레슨 선생님을 찾습니다. 주 1회, 고등학생 대상.', category: PostCategory.LESSON_OFFER, instruments: ['기타'], region: '대구 중구', payType: PayType.HOURLY, payMin: 28000, author: u[4], authorId: u[4].id },
    { title: '성인 피아노 레슨 선생님 구합니다', content: '성인 입문자 피아노 레슨 선생님 구합니다. 저녁 6-9시 시간대. 동영상 레슨도 고려 중.', category: PostCategory.LESSON_OFFER, instruments: ['피아노'], region: '인천 남동구', payType: PayType.HOURLY, payMin: 32000, author: u[1], authorId: u[1].id },
    { title: '예비 초등 피아노 레슨 교사 모집', content: '7세 아이 피아노 레슨 교사 모집. 어린이 지도 경험 필수. 방문 레슨.', category: PostCategory.LESSON_OFFER, instruments: ['피아노'], region: '서울 노원구', payType: PayType.HOURLY, payMin: 28000, author: u[0], authorId: u[0].id },
    { title: '바이올린 콩쿨 대비 레슨 교사', content: '콩쿨 준비 중인 중학생 바이올린 레슨 교사 구합니다. 콩쿨 지도 경험 필수.', category: PostCategory.LESSON_OFFER, instruments: ['바이올린'], region: '경기 분당구', payType: PayType.HOURLY, payMin: 50000, author: u[1], authorId: u[1].id },
    { title: '합창단 보컬 코치 구합니다', content: '아마추어 합창단 발성 코치 겸 지도자 모집. 성악 전공자 우대. 월 4회.', category: PostCategory.LESSON_OFFER, instruments: ['피아노'], region: '서울 은평구', payType: PayType.PER_SESSION, payMin: 120000, author: u[2], authorId: u[2].id },
    { title: '드럼 레슨 선생님 급구', content: '초보 성인 드럼 레슨 선생님 구합니다. 주 1회, 연습실 비용 별도 지원.', category: PostCategory.LESSON_OFFER, instruments: ['드럼'], region: '서울 강동구', payType: PayType.HOURLY, payMin: 30000, author: u[4], authorId: u[4].id },
  ];

  const lessonSeeks: Partial<Post>[] = [
    { title: '피아노 레슨 가능합니다 - 음대 재학생', content: '음대 피아노 전공 3학년. 초~중급 학생 지도 가능. 강남·서초 지역 출장 레슨.', category: PostCategory.LESSON_SEEK, instruments: ['피아노'], region: '서울 강남구', payType: PayType.HOURLY, payMin: 40000, author: u[0], authorId: u[0].id },
    { title: '음대 출신 첼로 레슨 구직', content: '음대 첼로과 졸업. 어린이~성인 모두 지도 가능. 스즈키·전통 교수법 병행.', category: PostCategory.LESSON_SEEK, instruments: ['첼로'], region: '경기 성남시', payType: PayType.HOURLY, payMin: 45000, author: u[2], authorId: u[2].id },
    { title: '바이올린 레슨 구직합니다', content: '음고 출신 바이올린 선생님. 초급 교재부터 협주곡까지 지도. 화상 레슨도 가능.', category: PostCategory.LESSON_SEEK, instruments: ['바이올린'], region: '서울 마포구', payType: PayType.HOURLY, payMin: 40000, author: u[1], authorId: u[1].id },
    { title: '플루트 레슨 구직 - 전공자', content: '국악·서양음악 겸비 플루트 연주자. 어린이 플루트 지도 전문.', category: PostCategory.LESSON_SEEK, instruments: ['플루트'], region: '부산·경남 전지역', payType: PayType.HOURLY, payMin: 35000, author: u[3], authorId: u[3].id },
    { title: '클래식 기타 레슨 구직합니다', content: '클래식 기타 전공. 입문~중급 지도. 출장 레슨 가능. 악보 무료 제공.', category: PostCategory.LESSON_SEEK, instruments: ['기타'], region: '대구 전지역', payType: PayType.HOURLY, payMin: 30000, author: u[4], authorId: u[4].id },
    { title: '성악·발성 레슨 구직합니다', content: '성악 전공. 대중가요 보컬 트레이닝 및 클래식 성악 레슨 가능. 온·오프라인 모두 가능.', category: PostCategory.LESSON_SEEK, instruments: ['피아노'], region: '서울 전지역', payType: PayType.HOURLY, payMin: 50000, author: u[0], authorId: u[0].id },
    { title: '작곡·화성학 레슨 구직', content: '작곡 전공 대학원생. 화성학·대위법·편곡 레슨 전문. 입시생 지도 경험 다수.', category: PostCategory.LESSON_SEEK, instruments: ['피아노'], region: '서울 관악구', payType: PayType.HOURLY, payMin: 60000, author: u[2], authorId: u[2].id },
    { title: '피아노 입시 전문 레슨 구직', content: '음대 피아노과 입시 전문 교사. 예중·예고·음대 입시 지도 경험. 체르니~쇼팽 전 범위.', category: PostCategory.LESSON_SEEK, instruments: ['피아노'], region: '서울 강남·서초', payType: PayType.HOURLY, payMin: 70000, author: u[0], authorId: u[0].id },
    { title: '바이올린·비올라 레슨 구직', content: '바이올린·비올라 모두 가능. 학교 오케스트라 지도 경험 보유.', category: PostCategory.LESSON_SEEK, instruments: ['바이올린'], region: '인천 전지역', payType: PayType.HOURLY, payMin: 38000, author: u[1], authorId: u[1].id },
    { title: '국악·양금 레슨 구직합니다', content: '국악 기악과 졸업. 양금·가야금 레슨 가능. 국악 입문자 환영.', category: PostCategory.LESSON_SEEK, instruments: ['기타'], region: '대전 전지역', payType: PayType.HOURLY, payMin: 32000, author: u[4], authorId: u[4].id },
  ];

  const promoConcerts: Partial<Post>[] = [
    { title: '제3회 정기연주회 초대합니다', content: '반모 피아노 앙상블의 제3회 정기연주회를 개최합니다. 베토벤 소나타, 쇼팽 발라드 등 수준 높은 프로그램으로 찾아갑니다. 입장 무료.', category: PostCategory.PROMO_CONCERT, instruments: ['피아노'], region: '서울 강남구', payType: PayType.NEGOTIABLE, payMin: 0, author: u[0], authorId: u[0].id },
    { title: '봄 실내악 연주회 홍보', content: '봄을 맞아 피아노 트리오 연주회를 개최합니다. 슈베르트·브람스·드보르자크 트리오. 예매 필수.', category: PostCategory.PROMO_CONCERT, instruments: ['피아노', '바이올린', '첼로'], region: '서울 종로구', payType: PayType.NEGOTIABLE, payMin: 0, author: u[1], authorId: u[1].id },
    { title: '피아노 독주회 - 쇼팽 프로그램', content: '쇼팽 탄생 기념 피아노 독주회. 녹턴·발라드·스케르초 전곡 프로그램. 초대권 배포 중.', category: PostCategory.PROMO_CONCERT, instruments: ['피아노'], region: '경기 성남시', payType: PayType.NEGOTIABLE, payMin: 0, author: u[2], authorId: u[2].id },
    { title: '바이올린·피아노 듀오 리사이틀', content: '바이올린과 피아노의 하모니. 프랑크 소나타, 라벨 소나타 등 프랑스 레퍼토리 위주.', category: PostCategory.PROMO_CONCERT, instruments: ['바이올린', '피아노'], region: '부산 해운대구', payType: PayType.NEGOTIABLE, payMin: 0, author: u[3], authorId: u[3].id },
    { title: '합창단 정기연주회 초대합니다', content: '지역 합창단 창단 10주년 기념 연주회. 헨델 메시아 중 하이라이트 프로그램. 무료 입장.', category: PostCategory.PROMO_CONCERT, instruments: ['피아노'], region: '대구 중구', payType: PayType.NEGOTIABLE, payMin: 0, author: u[4], authorId: u[4].id },
    { title: '첼로 협주곡의 밤', content: '드보르자크·엘가 첼로 협주곡. 지역 체임버 오케스트라와 협연. 유료(5,000원).', category: PostCategory.PROMO_CONCERT, instruments: ['첼로'], region: '인천 미추홀구', payType: PayType.NEGOTIABLE, payMin: 0, author: u[2], authorId: u[2].id },
    { title: '플루트 앙상블 정기연주회', content: '플루트 5중주 연주회. 바흐 관현악 모음곡부터 현대 작품까지. 입장 무료.', category: PostCategory.PROMO_CONCERT, instruments: ['플루트'], region: '부산 남구', payType: PayType.NEGOTIABLE, payMin: 0, author: u[3], authorId: u[3].id },
    { title: '클래식 기타 갈라 콘서트', content: '클래식 기타 연주자들의 갈라 콘서트. 솔로·앙상블·협연 다채로운 프로그램.', category: PostCategory.PROMO_CONCERT, instruments: ['기타'], region: '서울 강서구', payType: PayType.NEGOTIABLE, payMin: 0, author: u[4], authorId: u[4].id },
    { title: '어린이를 위한 클래식 음악회', content: '어린이 눈높이 맞춤 클래식 해설 음악회. 악기 체험 코너 운영. 가족 단위 환영.', category: PostCategory.PROMO_CONCERT, instruments: ['피아노', '바이올린'], region: '경기 수원시', payType: PayType.NEGOTIABLE, payMin: 0, author: u[0], authorId: u[0].id },
    { title: '재즈 피아노 트리오 공연 안내', content: '재즈 피아노·베이스·드럼 트리오 공연. 스탠더드 재즈부터 현대 재즈까지. 예약 입장.', category: PostCategory.PROMO_CONCERT, instruments: ['피아노'], region: '서울 홍대', payType: PayType.NEGOTIABLE, payMin: 0, author: u[1], authorId: u[1].id },
  ];

  const tradeInstruments: Partial<Post>[] = [
    { title: '야마하 그랜드피아노 C3 판매합니다', content: '야마하 C3 1990년식. 정기 조율 유지. 피아노 학원 이전으로 판매. 직거래 우선. 사진 요청시 별도 전송.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['피아노'], region: '서울 강남구', payType: PayType.PER_SESSION, payMin: 8000000, author: u[0], authorId: u[0].id },
    { title: '스트라디바리 모델 바이올린 양도', content: '독일 마이스터 제작 바이올린. 스트라디바리 모델. 활·케이스 포함. 콩쿨 입상 후 업그레이드로 양도.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['바이올린'], region: '서울 마포구', payType: PayType.PER_SESSION, payMin: 3500000, author: u[1], authorId: u[1].id },
    { title: '피아솔라 모델 첼로 판매', content: '독일 공방 4/4 첼로. 음색 풍부, 반응 좋음. 이탈리아산 활·하드케이스 포함.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['첼로'], region: '경기 성남시', payType: PayType.PER_SESSION, payMin: 2800000, author: u[2], authorId: u[2].id },
    { title: '무라마츠 플루트 EX 판매', content: '무라마츠 EX 은관. 3년 사용. 사운드홀 14K. 정기 수리 완료. 케이스 포함.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['플루트'], region: '부산 해운대구', payType: PayType.PER_SESSION, payMin: 1500000, author: u[3], authorId: u[3].id },
    { title: '야마하 클래식 기타 GC82S 양도', content: '야마하 GC82S 삼나무 탑. 1년 사용. 거의 새것 상태. 하드케이스·보조 악기 포함.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['기타'], region: '대구 중구', payType: PayType.PER_SESSION, payMin: 900000, author: u[4], authorId: u[4].id },
    { title: '롤랜드 전자피아노 FP-90X 판매', content: '롤랜드 FP-90X 2022년 구입. 이사로 판매. 스탠드·페달 포함. 상태 최상.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['피아노'], region: '인천 연수구', payType: PayType.PER_SESSION, payMin: 1200000, author: u[1], authorId: u[1].id },
    { title: '갈레리 첼로 활 판매합니다', content: '갈레리 페르남부코 활. 무게 62g. 음색 밝고 반응 빠름. 케이스 포함.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['첼로'], region: '서울 서초구', payType: PayType.PER_SESSION, payMin: 500000, author: u[2], authorId: u[2].id },
    { title: '피카르디 바이올린 7/8 판매', content: '초등학생 자녀가 사용하던 7/8 바이올린. 활·케이스·어깨받침 포함. 상태 양호.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['바이올린'], region: '경기 분당구', payType: PayType.PER_SESSION, payMin: 350000, author: u[0], authorId: u[0].id },
    { title: '카와이 업라이트 피아노 US6X 판매', content: '카와이 US6X 하이브리드 어쿠스틱. 2019년식. 조율 완료. 이사로 인해 판매.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['피아노'], region: '서울 강서구', payType: PayType.PER_SESSION, payMin: 5500000, author: u[3], authorId: u[3].id },
    { title: '플루트 교습용 입문 세트 판매', content: '야마하 YFL-222 + 보면대 + 악보집 세트. 초보자 입문용. 상태 양호.', category: PostCategory.TRADE_INSTRUMENT, instruments: ['플루트'], region: '서울 노원구', payType: PayType.PER_SESSION, payMin: 280000, author: u[4], authorId: u[4].id },
  ];

  return [
    ...jobOffers,
    ...jobSeeks,
    ...lessonOffers,
    ...lessonSeeks,
    ...promoConcerts,
    ...tradeInstruments,
  ];
}

function makeBoards(users: User[]): Partial<Board>[] {
  const u = users;

  const freeBoards: Partial<Board>[] = [
    { type: BoardType.FREE, title: '반주자 구할 때 주의사항 공유해요', content: '처음 반주자 구하시는 분들을 위해 경험을 공유합니다.\n\n1. 페이를 미리 명확히 협의하세요\n2. 리허설 횟수와 비용을 별도로 정하세요\n3. 악보 제공 시기를 미리 합의하세요\n\n모두 좋은 반주자 만나시길 바랍니다!', author: u[0], authorId: u[0].id },
    { type: BoardType.FREE, title: '레슨비 협상 어떻게 하시나요?', content: '처음 레슨 자리를 잡을 때 학원 측에서 제시한 금액이 생각보다 낮았어요. 다들 어떻게 협상하시나요? 포트폴리오를 보여주는 방법이 효과적이었다는 분 계신가요?', author: u[1], authorId: u[1].id },
    { type: BoardType.FREE, title: '콩쿨 반주 경험담 나눠요', content: '지난 주에 학생 콩쿨 반주를 처음 맡았는데 너무 긴장했어요. 결과적으로 학생이 입상해서 뿌듯했지만, 준비 과정에서 어려웠던 점들을 공유하고 싶어요.', author: u[2], authorId: u[2].id },
    { type: BoardType.FREE, title: '음표 등급 올리려면 어떻게 해야 하나요?', content: '반모 플랫폼의 음표 등급 시스템이 궁금합니다. 어떤 기준으로 등급이 올라가나요? 신뢰 점수와 관련이 있는 건가요?', author: u[3], authorId: u[3].id },
    { type: BoardType.FREE, title: '반주자 교통비는 어떻게 처리하시나요?', content: '방문 반주를 맡게 됐는데 교통비 처리가 애매하네요. 보통 포함해서 받으시나요, 따로 받으시나요? 거리 기준이 있으신지 궁금합니다.', author: u[4], authorId: u[4].id },
    { type: BoardType.FREE, title: '초견 능력 향상 팁 공유합니다', content: '저는 매일 새 악보 3페이지씩 초견 연습을 해왔습니다. 6개월 만에 확실히 실력이 늘었어요. 악보 사이트 추천: IMSLP, Musescore 등 활용하시면 좋아요.', author: u[0], authorId: u[0].id },
    { type: BoardType.FREE, title: '리허설 없이 바로 공연 가능하신가요?', content: '급하게 반주자 필요한 상황인데, 리허설 없이 당일 공연 경험 있으신 분 계신가요? 어떻게 대처하셨는지 궁금합니다.', author: u[1], authorId: u[1].id },
    { type: BoardType.FREE, title: '악보 PDF를 미리 받지 못하면 어떻게 하세요?', content: '의뢰인이 악보를 공연 직전에 주는 경우가 있어서... 이런 상황 어떻게 처리하시나요? 계약 시 명시해야 할까요?', author: u[2], authorId: u[2].id },
    { type: BoardType.FREE, title: '반모 플랫폼 사용 후기 - 좋았던 점', content: '반모로 한 달 만에 세 건의 반주 의뢰를 받았습니다! 필터 기능이 편리해서 악기별로 쉽게 찾을 수 있었어요. 다들 활발하게 이용해주세요 :)', author: u[3], authorId: u[3].id },
    { type: BoardType.FREE, title: '연주회 반주 vs 레슨 반주 어떤 게 더 좋나요?', content: '두 가지 모두 경험해보신 분들 의견이 궁금합니다. 저는 레슨 반주가 정기적이라 좋던데, 연주회 반주는 무대 경험이 쌓이는 게 매력인 것 같아요.', author: u[4], authorId: u[4].id },
  ];

  const anonymousBoards: Partial<Board>[] = [
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '너무 낮은 페이 제시받았어요 ㅠㅠ', content: '경력 3년인데 시급 15,000원을 제시받았어요. 최저시급도 안 되는데... 이런 경우 어떻게 대응하시나요? 그냥 거절해야 할까요?', author: u[0], authorId: u[0].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '반주 거절당했는데 상처받네요', content: '이력서 넣고 오디션까지 봤는데 탈락했습니다. 이유도 안 알려주고... 마음이 많이 힘드네요. 다들 이런 경험 있으신가요?', author: u[1], authorId: u[1].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '의뢰인이 약속 당일 취소했어요', content: '당일 아침에 취소 연락이 왔는데 교통비도 못 받았어요. 계약서를 안 썼는데 보상받을 방법이 없을까요?', author: u[2], authorId: u[2].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '페이 협상이 너무 어려워요', content: '처음 의뢰 잡을 때 페이 얘기 꺼내기가 너무 부끄럽고 어색해요. 어떻게 자연스럽게 협상하시나요?', author: u[3], authorId: u[3].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '프리랜서 세금 신고 어떻게 하시나요?', content: '반주 수입이 생기기 시작했는데 세금 신고를 어떻게 해야 할지 모르겠어요. 3.3% 원천징수 받아야 하나요?', author: u[4], authorId: u[4].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '레슨비 미지급 상황 어떻게 하셨나요?', content: '2달 치 레슨비를 못 받고 있어요. 학원 원장님이 계속 미루는데 어떻게 해야 할까요?', author: u[0], authorId: u[0].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '반주 실력이 너무 부족한 것 같아요', content: '의뢰는 받았는데 연습할수록 내 실력이 부족한 것 같아서 자신감이 없어요. 포기해야 할까요 아니면 솔직하게 말해야 할까요?', author: u[1], authorId: u[1].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '의뢰인이 리허설 중 무례하게 대해서 힘들어요', content: '피아노 반주인데 의뢰인이 계속 반말하고 무례하게 대해요. 이미 계약 완료한 상황인데 어떻게 해야 할까요?', author: u[2], authorId: u[2].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '음표 등급이 안 올라가는 이유가 뭘까요?', content: '반주 여러 건 완료했는데 등급이 BASIC에서 안 올라가네요. 후기가 없어서 그런 걸까요?', author: u[3], authorId: u[3].id },
    { type: BoardType.ANONYMOUS, isAnonymous: true, title: '반주 거리가 멀어서 고민이에요', content: '좋은 조건인데 왕복 2시간 거리예요. 교통비 추가 요청이 가능할까요? 아니면 거절하는 게 나을까요?', author: u[4], authorId: u[4].id },
  ];

  const notices: Partial<Board>[] = [
    {
      type: BoardType.NOTICE,
      title: '반모 플랫폼 오픈 안내',
      content: '안녕하세요, 반모(반주의 모든것) 플랫폼이 정식 오픈했습니다!\n\n반모는 반주자와 연주자를 연결하는 매칭 플랫폼으로, 투명한 페이 공개와 신뢰 기반의 매칭을 목표로 합니다.\n\n주요 기능:\n- 구인/구직 공고 등록\n- 악기·지역·페이 필터 검색\n- 1:1 채팅 매칭\n- 음표 등급 신뢰 시스템\n\n많은 이용 부탁드립니다.',
      author: u[0],
      authorId: u[0].id,
    },
    {
      type: BoardType.NOTICE,
      title: '페이 최저 기준 정책 안내',
      content: '반모 플랫폼의 페이 정책을 안내드립니다.\n\n시급 기준 공고는 2024년 법정 최저시급(10,030원) 이상만 등록 가능합니다. 최저시급 미만의 공고는 등록 시 경고가 표시됩니다.\n\n공정한 반주자 처우 개선을 위해 적정 페이 지급에 협조해 주시기 바랍니다.',
      author: u[0],
      authorId: u[0].id,
    },
    {
      type: BoardType.NOTICE,
      title: '음표 등급 시스템 안내',
      content: '반모의 음표 등급 시스템을 소개합니다.\n\n♩ 초급(BASIC): 신규 가입 후 첫 활동 시작\n♪ 중급(INTERMEDIATE): 신뢰 점수 30점 이상\n♫ 고급(ADVANCED): 신뢰 점수 60점 이상\n♬ 전문(PROFESSIONAL): 신뢰 점수 100점 이상\n\n신뢰 점수는 거래 완료, 후기 작성, 커뮤니티 활동 등을 통해 쌓입니다.',
      author: u[0],
      authorId: u[0].id,
    },
  ];

  return [...freeBoards, ...anonymousBoards, ...notices];
}

// ─────────────────────────────────────────────
// 메인 시드 실행
// ─────────────────────────────────────────────
async function seed() {
  console.log('🌱 시드 스크립트 시작...');

  await AppDataSource.initialize();
  console.log('✅ DB 연결 완료');

  const userRepo = AppDataSource.getRepository(User);
  const postRepo = AppDataSource.getRepository(Post);
  const boardRepo = AppDataSource.getRepository(Board);

  // ── 기존 데이터 정리 (seed 재실행 가능하도록)
  for (const kakaoId of ['test_001', 'test_002', 'test_003', 'test_004', 'test_005']) {
    const existing = await userRepo.findOne({ where: { kakaoId } });
    if (existing) {
      await boardRepo.delete({ authorId: existing.id });
      await postRepo.delete({ authorId: existing.id });
      await userRepo.delete({ id: existing.id });
    }
  }
  console.log('🧹 기존 seed 데이터 정리 완료');

  // ── 유저 삽입
  const savedUsers: User[] = [];
  for (const u of SAMPLE_USERS) {
    const user = userRepo.create(u as Partial<User>);
    savedUsers.push(await userRepo.save(user));
  }
  console.log(`👥 유저 ${savedUsers.length}명 삽입 완료`);

  // ── 공고 삽입
  const postData = makePosts(savedUsers);
  let postCount = 0;
  for (const p of postData) {
    const post = postRepo.create(p as Partial<Post>);
    await postRepo.save(post);
    postCount++;
  }
  console.log(`📋 공고 ${postCount}개 삽입 완료`);

  // ── 게시판 삽입
  const boardData = makeBoards(savedUsers);
  let boardCount = 0;
  for (const b of boardData) {
    const board = boardRepo.create(b as Partial<Board>);
    await boardRepo.save(board);
    boardCount++;
  }
  console.log(`📝 게시판 ${boardCount}개 삽입 완료`);

  await AppDataSource.destroy();
  console.log('\n🎵 시드 완료! DBeaver에서 확인하세요.');
  console.log('  - users 테이블: 5명');
  console.log(`  - posts 테이블: ${postCount}개`);
  console.log(`  - boards 테이블: ${boardCount}개`);
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
    entities: [User, Post, Board],
    synchronize: false,
  });

  await ds.initialize();
  console.log('✅ DB 연결 완료');

  // 외래키 의존 순서로 삭제
  await ds.query(`DELETE FROM board_comments`);
  console.log('  🧹 board_comments 삭제 완료');

  await ds.query(`DELETE FROM chat_messages`);
  console.log('  🧹 chat_messages 삭제 완료');

  await ds.query(`DELETE FROM applications`);
  console.log('  🧹 applications 삭제 완료');

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

  // users: admin 계정 제외하고 삭제
  await ds.query(`DELETE FROM users WHERE role != 'ADMIN'`);
  console.log('  🧹 users 삭제 완료 (admin 계정 유지)');

  await ds.destroy();
  console.log('\n✅ DB 초기화 완료! admin 계정만 유지됩니다.');
}

const args = process.argv.slice(2);
if (args.includes('--clear')) {
  seedClear().catch((err) => {
    console.error('❌ DB 초기화 실패:', err);
    process.exit(1);
  });
} else {
  seed().catch((err) => {
    console.error('❌ 시드 실패:', err);
    process.exit(1);
  });
}
