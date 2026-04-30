'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePosts } from '@/hooks/usePosts';
import type { Post } from '@/types';

const TABS = [
  { value: 'PROMO_CONCERT', label: '공연홍보', emoji: '🎵' },
  { value: 'PROMO_SPACE',   label: '연습실 대여', emoji: '🏠' },
];

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산'];

function PromoCard({ post }: { post: Post }) {
  const isPremium = post.isPremium;
  const firstImage = post.imageUrls?.find(Boolean);

  return (
    <Link href={`/promo/${post.id}`}>
      <div className={`group relative flex flex-col rounded-2xl bg-white shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${isPremium ? 'border-amber-300' : 'border-gray-100'}`}>
        {/* 썸네일 */}
        <div className="relative h-44 bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
          {firstImage ? (
            <Image src={firstImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">
              {post.category === 'PROMO_CONCERT' ? '🎹' : '🏛'}
            </div>
          )}
          {isPremium && (
            <span className="absolute top-2 left-2 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white shadow">
              👑 프리미엄
            </span>
          )}
        </div>
        {/* 본문 */}
        <div className="flex flex-col gap-1.5 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug">
            {post.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
            <span>📍 {post.region ?? '지역 미정'}</span>
            {post.payMin > 0 && (
              <span className="font-medium text-violet-700">
                {post.payType === 'NEGOTIABLE' ? '협의' : `${(post.payMin / 10000).toFixed(0)}만원~`}
              </span>
            )}
          </div>
          <div className="text-xs text-gray-300 mt-0.5">
            {new Date(post.createdAt).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PromoPage() {
  const [tab, setTab] = useState('PROMO_CONCERT');
  const [region, setRegion] = useState('');

  const { data, isLoading } = usePosts({
    category: tab,
    region: region || undefined,
    limit: 40,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 탭 */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 py-3">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.value
                    ? 'bg-pink-600 text-white'
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

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* 지역 필터 + 글쓰기 */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-pink-400 focus:outline-none"
          >
            <option value="">전체 지역</option>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              {data ? `총 ${data.total}건` : ''}
            </span>
            <Link
              href="/jobs/write"
              className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 transition-colors"
            >
              + 공연/연습실 등록
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-56 rounded-2xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <span className="text-5xl mb-3">🎼</span>
            <p>등록된 공연/연습실이 없습니다.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {data?.items.map((post) => (
              <PromoCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
