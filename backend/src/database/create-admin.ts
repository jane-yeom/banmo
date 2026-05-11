import { DataSource } from 'typeorm';
import { User, UserRole, LoginType, NoteGrade } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../../.env') });

async function createAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    host: process.env.DB_HOST || process.env.DATABASE_HOST || 'localhost',
    port: +(process.env.DB_PORT || process.env.DATABASE_PORT || 5432),
    username: process.env.DB_USER || process.env.DATABASE_USER || 'banmo_user',
    password: process.env.DB_PASS || process.env.DATABASE_PASSWORD || 'banmo_pass',
    database: process.env.DB_NAME || process.env.DATABASE_NAME || 'banmo',
    entities: [User],
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false } : false,
  });

  await dataSource.initialize();
  const userRepo = dataSource.getRepository(User);

  const existing = await userRepo.findOne({ where: { email: 'admin@banmo.com' } });
  if (existing) {
    console.log('✅ 관리자 계정 이미 존재:', existing.email);
    await dataSource.destroy();
    return;
  }

  const hashedPassword = await bcrypt.hash('Banmo@Admin2026!', 12);

  const admin = userRepo.create({
    email: 'admin@banmo.com',
    password: hashedPassword,
    nickname: '반모관리자',
    role: UserRole.ADMIN,
    loginType: LoginType.EMAIL,
    noteGrade: NoteGrade.WHOLE,
    trustScore: 999,
  } as unknown as User);

  await userRepo.save(admin);
  console.log('✅ 관리자 계정 생성 완료!');
  console.log('📧 이메일: admin@banmo.com');
  console.log('🔑 비밀번호: Banmo@Admin2026!');
  console.log('⚠️  로그인 후 반드시 비밀번호를 변경하세요!');

  await dataSource.destroy();
}

createAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});
