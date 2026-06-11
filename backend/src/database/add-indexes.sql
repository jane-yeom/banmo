-- 자주 조회되는 컬럼 인덱스
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_posts_author ON posts("authorId");
CREATE INDEX IF NOT EXISTS idx_boards_type ON boards(type);
CREATE INDEX IF NOT EXISTS idx_boards_created_at ON boards("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_users_kakao_id ON users("kakaoId");
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications("userId");
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications("isRead");
