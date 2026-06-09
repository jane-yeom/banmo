'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBoardPosts, type BoardPost } from '@/hooks/useBoard';
import { MessageCircle, EyeOff } from 'lucide-react';
import EmptyState from '@/components/common/EmptyState';
import api from '@/lib/axios';

const TABS = [
  { value: 'FREE',      label: '자유게시판', Icon: MessageCircle },
  { value: 'ANONYMOUS', label: '익명게시판', Icon: EyeOff },
];

const TYPE_LABEL: Record<string, string> = {
  FREE:      '자유',
  ANONYMOUS: '익명',
};

const TYPE_COLOR: Record<string, string> = {
  FREE:      'bg-teal-100 text-teal-700',
  ANONYMOUS: 'bg-gray-100 text-gray-600',
};

function BoardRow({ post }: { post: BoardPost }) {
  return (
    <Link href={`/board/${post.id}`}>
      <div className="flex items-start gap-3 border-b border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors">
        <span className={`mt-0.5 flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLOR[post.type] ?? 'bg-gray-100 text-gray-600'}`}>
          {TYPE_LABEL[post.type] ?? post.type}
        </span>
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{post.title}</p>
          {post.tags && post.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
              {post.tags.map(tag => (
                <span key={tag} style={{
                  fontSize: 11, color: '#9CA3AF',
                  background: '#F4F3F9', borderRadius: 99,
                  padding: '1px 7px',
                }}>#{tag}</span>
              ))}
            </div>
          )}
          <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-400">
            <span>{post.isAnonymous ? '익명' : (post.author?.nickname ?? '익명')}</span>
            <span>·</span>
            <span>{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
            <span>·</span>
            <span>조회 {post.viewCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function BoardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialType = searchParams.get('type') === 'ANONYMOUS' ? 'ANONYMOUS' : 'FREE';
  const initialTag = searchParams.get('tag') || null;

  const [tab, setTab] = useState<'FREE' | 'ANONYMOUS'>(initialType as 'FREE' | 'ANONYMOUS');
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(initialTag);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'comments'>('latest');
  const [popularTags, setPopularTags] = useState<any[]>([]);

  useEffect(() => {
    api.get('/board/tags/popular')
      .then(res => setPopularTags(res.data || []))
      .catch(() => {});
  }, []);

  const { data: result, isLoading } = useBoardPosts({
    type: tab,
    tag: selectedTag || undefined,
    sort: sortBy,
    limit: 50,
  });

  const posts = result?.data || [];

  const filtered = search
    ? posts.filter((p) => p.title.includes(search) || p.content.includes(search))
    : posts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 탭 */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value as 'FREE' | 'ANONYMOUS'); setSelectedTag(null); }}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <t.Icon size={14} strokeWidth={1.8} />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 정렬 + 인기 태그 */}
      <div style={{ background: 'white', padding: '12px 16px', borderBottom: '0.5px solid #F4F3F9' }}>
        <div className="mx-auto max-w-3xl">
          {/* 정렬 버튼 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[
              { key: 'latest', label: '최신순' },
              { key: 'popular', label: '인기순' },
              { key: 'comments', label: '댓글많은순' },
            ].map(sort => (
              <button key={sort.key}
                onClick={() => setSortBy(sort.key as any)}
                style={{
                  padding: '6px 14px', borderRadius: 99,
                  border: `1px solid ${sortBy === sort.key ? '#1C1C1C' : '#E8E4DC'}`,
                  background: sortBy === sort.key ? '#1C1C1C' : 'white',
                  color: sortBy === sort.key ? 'white' : '#555',
                  fontSize: 13, fontWeight: sortBy === sort.key ? 600 : 400,
                  cursor: 'pointer',
                }}>
                {sort.label}
              </button>
            ))}
          </div>

          {/* 인기 태그 */}
          {popularTags.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 8, fontWeight: 600 }}>
                🔥 인기 태그
              </div>
              <div style={{
                display: 'flex', gap: 6, overflowX: 'auto',
                scrollbarWidth: 'none', paddingBottom: 4,
              }}>
                <button
                  onClick={() => setSelectedTag(null)}
                  style={{
                    padding: '5px 12px', borderRadius: 99, flexShrink: 0,
                    border: `1px solid ${!selectedTag ? '#1C1C1C' : '#E8E4DC'}`,
                    background: !selectedTag ? '#1C1C1C' : 'white',
                    color: !selectedTag ? 'white' : '#555',
                    fontSize: 12, cursor: 'pointer', fontWeight: !selectedTag ? 600 : 400,
                  }}>
                  전체
                </button>
                {popularTags.map(tag => (
                  <button key={tag.name}
                    onClick={() => setSelectedTag(selectedTag === tag.name ? null : tag.name)}
                    style={{
                      padding: '5px 12px', borderRadius: 99, flexShrink: 0,
                      border: `1px solid ${selectedTag === tag.name ? '#1C1C1C' : '#E8E4DC'}`,
                      background: selectedTag === tag.name ? '#1C1C1C' : 'white',
                      color: selectedTag === tag.name ? 'white' : '#555',
                      fontSize: 12, cursor: 'pointer',
                      fontWeight: selectedTag === tag.name ? 600 : 400,
                    }}>
                    #{tag.name}
                    <span style={{
                      color: selectedTag === tag.name ? 'rgba(255,255,255,0.6)' : '#9CA3AF',
                      marginLeft: 4, fontSize: 10,
                    }}>
                      {tag.useCount}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-5">
        {/* 검색 + 글쓰기 */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제목 또는 내용 검색"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-teal-400 focus:outline-none"
          />
          <Link
            href={`/board/write?type=${tab}`}
            className="flex-shrink-0 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 transition-colors"
          >
            + 글쓰기
          </Link>
        </div>

        {/* 게시글 목록 */}
        <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{ padding: '14px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ height: 12, width: '60%', background: '#F7F4ED', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ height: 10, width: '35%', background: '#F7F4ED', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="✏️"
              title="게시글이 없어요"
              sub="첫 번째 글을 작성해보세요!"
              href={`/board/write?type=${tab}`}
              btnText="글쓰기"
            />
          ) : (
            filtered.map((post) => <BoardRow key={post.id} post={post} />)
          )}
        </div>
      </div>
    </div>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">로딩 중...</div>
      </div>
    }>
      <BoardContent />
    </Suspense>
  );
}
