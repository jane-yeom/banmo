'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useBoardPosts, type BoardPost } from '@/hooks/useBoard';

const TABS = [
  { value: 'FREE',      label: '자유게시판', emoji: '💬' },
  { value: 'ANONYMOUS', label: '익명게시판', emoji: '🎭' },
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
  const initialType = searchParams.get('type') === 'ANONYMOUS' ? 'ANONYMOUS' : 'FREE';
  const [tab, setTab] = useState<'FREE' | 'ANONYMOUS'>(initialType as 'FREE' | 'ANONYMOUS');
  const [search, setSearch] = useState('');

  const { data: posts, isLoading } = useBoardPosts(tab);

  const filtered = search
    ? posts?.filter((p) => p.title.includes(search) || p.content.includes(search))
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
                onClick={() => setTab(t.value as 'FREE' | 'ANONYMOUS')}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
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
            href="/board/write"
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
                <div key={i} className="h-16 border-b border-gray-100 px-4 py-3 animate-pulse bg-gray-50" />
              ))}
            </div>
          ) : filtered?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-5xl mb-3">📋</span>
              <p>게시글이 없습니다.</p>
            </div>
          ) : (
            filtered?.map((post) => <BoardRow key={post.id} post={post} />)
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
