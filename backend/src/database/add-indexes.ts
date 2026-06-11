import { DataSource } from 'typeorm'
import * as dotenv from 'dotenv'
dotenv.config()

async function addIndexes() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  await ds.initialize()

  const queries = [
    `CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)`,
    `CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)`,
    `CREATE INDEX IF NOT EXISTS idx_boards_type ON boards(type)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications("userId")`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications("isRead")`,
  ]

  for (const q of queries) {
    try {
      await ds.query(q)
      console.log('✅', q.substring(0, 60))
    } catch (e: any) {
      console.warn('⚠️', e.message)
    }
  }

  await ds.destroy()
  console.log('인덱스 추가 완료!')
}

addIndexes().catch(console.error)
