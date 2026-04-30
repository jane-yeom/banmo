'use client';

import { useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/common/PostCard';
import { usePosts } from '@/hooks/usePosts';

const CATEGORY_TABS = [
  { value: '',             label: '전체' },
  { value: 'JOB_OFFER',   label: '반주자 구인' },
  { value: 'JOB_SEEK',    label: '반주자 구직' },
  { value: 'LESSON_OFFER',label: '레슨 구인' },
  { value: 'LESSON_SEEK', label: '레슨 구직' },
  { value: 'PERFORMANCE', label: '공연 도우미' },
  { value: 'AFTERSCHOOL', label: '방과후 교사' },
];

const INSTRUMENTS = [
  '피아노', '바이올린', '비올라', '첼로', '콘트라베이스',
  '플루트', '오보에', '클라리넷', '바순', '호른',
  '트럼펫', '트롬본', '타악기', '기타', '하프',
];

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산'];

export default function JobsPage() {
  const [category, setCategory] = useState('');
  const [instrument, setInstrument] = useState('');
  const [region, setRegion] = useState('');
  const [payMin, setPayMin] = useState(0);
  const [payMax, setPayMax] = useState(500000);

  const { data, isLoading } = usePosts({ category: category || undefined, instrument: instrument || undefined, region: region || undefined, payMin: payMin || undefined, payMax: payMax < 500000 ? payMax : undefined });

  // 프리미엄 공고 상단 정렬
  const sortedItems = data?.items
    ? [...data.items.filter((p) => p.isPremium), ...data.items.filter((p) => !p.isPremium)]
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 카테고리 탭 */}
      <div className="sticky top-16 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setCategory(tab.value)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  category === tab.value
                    ? 'bg-violet-700 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* 사이드 필터 */}
          <aside className="w-full lg:w-56 flex-shrink-0">
            <div className="rounded-xl bg-white p-4 shadow-sm border border-gray-100 space-y-5">
              {/* 악기 필터 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">악기</p>
                <div className="flex flex-wrap gap-1.5">
                  {INSTRUMENTS.map((inst) => (
                    <button
                      key={inst}
                      onClick={() => setInstrument(instrument === inst ? '' : inst)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        instrument === inst
                          ? 'border-violet-700 bg-violet-700 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-violet-400'
                      }`}
                    >
                      {inst}
                    </button>
                  ))}
                </div>
              </div>

              {/* 지역 필터 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">지역</p>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                >
                  <option value="">전체 지역</option>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* 페이 범위 */}
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  최대 페이 {payMax < 500000 ? `${(payMax / 10000).toFixed(0)}만원` : '무제한'}
                </p>
                <input
                  type="range"
                  min={0}
                  max={500000}
                  step={10000}
                  value={payMax}
                  onChange={(e) => setPayMax(Number(e.target.value))}
                  className="w-full accent-violet-700"
                />
              </div>
            </div>
          </aside>

          {/* 목록 */}
          <div className="flex-1">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {data ? `총 ${data.total}건` : '로딩 중...'}
              </p>
              <Link
                href="/jobs/write"
                className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 transition-colors"
              >
                + 공고 작성
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-36 rounded-xl bg-gray-200 animate-pulse" />
                ))}
              </div>
            ) : sortedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <span className="text-5xl mb-3">🎵</span>
                <p>공고가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {sortedItems.map((post) => (
                  <Link key={post.id} href={`/jobs/${post.id}`}>
                    <PostCard
                      title={post.title}
                      category={post.category}
                      region={post.region ?? ''}
                      pay={post.payType === 'NEGOTIABLE' ? '협의' : `${(post.payMin / 10000).toFixed(0)}만원~`}
                      noteGrade={post.author?.noteGrade}
                      isPremium={post.isPremium}
                    />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
