'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePosts } from '@/hooks/usePosts';
import type { Post } from '@/types';

const TABS = [
  { value: 'TRADE_INSTRUMENT', label: '중고 악기', emoji: '🎸' },
  { value: 'TRADE_LESSON',     label: '레슨 양도', emoji: '📖' },
  { value: 'TRADE_SPACE',      label: '연습실 양도', emoji: '🏛' },
  { value: 'TRADE_TICKET',     label: '티켓 양도', emoji: '🎟' },
];

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산'];

function TradeCard({ post }: { post: Post }) {
  const firstImage = post.imageUrls?.find(Boolean);

  return (
    <Link href={`/trade/${post.id}`}>
      <div className="group flex gap-3 rounded-xl bg-white border border-gray-100 p-3 shadow-sm hover:shadow-md transition-shadow">
        {/* 썸네일 */}
        <div className="relative h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
          {firstImage ? (
            <Image src={firstImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl">
              {TABS.find(t => t.value === post.category)?.emoji ?? '📦'}
            </div>
          )}
        </div>
        {/* 내용 */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          <p className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug">
            {post.title}
          </p>
          <p className="text-xs text-gray-400 truncate">
            📍 {post.region ?? '지역 미정'}
          </p>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-sm font-bold text-amber-600">
              {post.payType === 'NEGOTIABLE' || post.payMin === 0
                ? '가격 협의'
                : `${(post.payMin / 10000).toFixed(0)}만원`}
            </span>
            <span className="text-xs text-gray-300">
              {new Date(post.createdAt).toLocaleDateString('ko-KR')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function TradePage() {
  const [tab, setTab] = useState('TRADE_INSTRUMENT');
  const [region, setRegion] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = usePosts({
    category: tab,
    region: region || undefined,
    limit: 40,
  });

  const filtered = search
    ? data?.items.filter((p) => p.title.includes(search) || p.content.includes(search))
    : data?.items;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 탭 */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-3xl px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.value
                    ? 'bg-amber-500 text-white'
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
        {/* 검색 + 필터 */}
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색어를 입력하세요"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
          />
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-amber-400 focus:outline-none"
          >
            <option value="">전체 지역</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* 상단 정보 + 글쓰기 */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filtered ? `총 ${filtered.length}건` : ''}
          </p>
          <Link
            href="/jobs/write"
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
          >
            + 글쓰기
          </Link>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : filtered?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-3">📦</span>
            <p>등록된 게시글이 없습니다.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered?.map((post) => (
              <TradeCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
