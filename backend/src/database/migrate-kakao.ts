/**
 * 마이그레이션 스크립트: 기존 카카오 유저의 원본 정보 채우기
 *
 * 실행 방법:
 *   npx ts-node -r tsconfig-paths/register src/database/migrate-kakao.ts
 *
 * 역할:
 * - 카카오 로그인 유저 중 kakaoNickname이 NULL인 경우 nickname 값을 복사
 * - 카카오 로그인 유저 중 kakaoEmail이 NULL인 경우 email 값을 복사
 * - 이미 값이 있는 경우 덮어쓰지 않음 (최초 가입 정보 보존)
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432'),
    username: process.env.DB_USER ?? process.env.DB_USERNAME,
    password: process.env.DB_PASS ?? process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
  });

  await ds.initialize();
  console.log('DB 연결 완료');

  // kakaoNickname이 NULL인 카카오 유저에 nickname 값 복사
  const nicknameResult = await ds.query(`
    UPDATE users
    SET "kakaoNickname" = nickname
    WHERE "loginType" = 'kakao'
      AND "kakaoNickname" IS NULL
      AND nickname IS NOT NULL
  `);
  console.log(`kakaoNickname 업데이트: ${nicknameResult[1] ?? 0}건`);

  // kakaoEmail이 NULL인 카카오 유저에 email 값 복사
  const emailResult = await ds.query(`
    UPDATE users
    SET "kakaoEmail" = email
    WHERE "loginType" = 'kakao'
      AND "kakaoEmail" IS NULL
      AND email IS NOT NULL
  `);
  console.log(`kakaoEmail 업데이트: ${emailResult[1] ?? 0}건`);

  await ds.destroy();
  console.log('완료');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
