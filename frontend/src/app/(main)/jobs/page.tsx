'use client';

import { useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/common/PostCard';
import { usePosts } from '@/hooks/usePosts';

const CATEGORY_TABS = [
  { value: '',              label: '전체' },
  { value: 'JOB_OFFER',    label: '반주자 구인' },
  { value: 'JOB_SEEK',     label: '반주자 구직' },
  { value: 'LESSON_OFFER', label: '레슨 구인' },
  { value: 'LESSON_SEEK',  label: '레슨 구직' },
  { value: 'PERFORMANCE',  label: '공연 도우미' },
  { value: 'AFTERSCHOOL',  label: '방과후 교사' },
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
  const [payMax, setPayMax] = useState(500000);
  const [filterOpen, setFilterOpen] = useState(false);

  const { data, isLoading } = usePosts({
    category: category || undefined,
    instrument: instrument || undefined,
    region: region || undefined,
    payMax: payMax < 500000 ? payMax : undefined,
  });

  // TODO: 유료 기능 활성화시 주석 해제 (프리미엄 공고 상단 정렬)
  // const sortedItems = data?.items
  //   ? [...data.items.filter((p) => p.isPremium), ...data.items.filter((p) => !p.isPremium)]
  //   : [];
  const sortedItems = data?.items ?? [];

  const activeFilters = [instrument, region, payMax < 500000 ? '페이' : ''].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 카테고리 탭 - 가로 스크롤 */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            padding: '10px 16px',
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
          className="scrollbar-none"
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              style={{
                whiteSpace: 'nowrap',
                borderRadius: 99,
                padding: '7px 16px',
                fontSize: 13,
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                background: category === tab.value ? '#7B82BE' : '#F3F4F6',
                color: category === tab.value ? 'white' : '#4B5563',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px' }}>
        {/* 상단 바 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            {data ? `총 ${data.total}건` : '로딩 중...'}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {/* 필터 버튼 (모바일) */}
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '7px 14px', borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: activeFilters > 0 ? '#ECEAF8' : 'white',
                color: activeFilters > 0 ? '#7B82BE' : '#374151',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              🎛 필터{activeFilters > 0 ? ` (${activeFilters})` : ''}
            </button>
            <Link
              href={`/write/jobs?category=${category || 'JOB_OFFER'}`}
              style={{
                padding: '7px 14px', borderRadius: 8,
                background: '#7B82BE', color: 'white',
                fontSize: 13, fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              + 공고 작성
            </Link>
          </div>
        </div>

        {/* 필터 패널 (토글) */}
        {filterOpen && (
          <div style={{
            background: 'white', borderRadius: 12,
            border: '1px solid #E5E7EB',
            padding: 16, marginBottom: 16,
          }}>
            {/* 악기 필터 */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.05em' }}>악기</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INSTRUMENTS.map((inst) => (
                  <button
                    key={inst}
                    onClick={() => setInstrument(instrument === inst ? '' : inst)}
                    style={{
                      borderRadius: 99, padding: '5px 12px',
                      fontSize: 12, cursor: 'pointer', border: '1px solid',
                      borderColor: instrument === inst ? '#7B82BE' : '#E5E7EB',
                      background: instrument === inst ? '#7B82BE' : 'white',
                      color: instrument === inst ? 'white' : '#6B7280',
                    }}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            {/* 지역 필터 */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.05em' }}>지역</p>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{
                  width: '100%', borderRadius: 8,
                  border: '1px solid #E5E7EB',
                  padding: '8px 12px', fontSize: 14,
                  outline: 'none', background: 'white',
                }}
              >
                <option value="">전체 지역</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* 페이 범위 */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.05em' }}>
                최대 페이: {payMax < 500000 ? `${(payMax / 10000).toFixed(0)}만원` : '무제한'}
              </p>
              <input
                type="range" min={0} max={500000} step={10000}
                value={payMax}
                onChange={(e) => setPayMax(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#7B82BE' }}
              />
            </div>
          </div>
        )}

        {/* 목록 */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{
                height: 88, borderRadius: 12,
                background: '#E5E7EB',
                animation: 'pulse 1.5s infinite',
              }} />
            ))}
          </div>
        ) : sortedItems.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '64px 0', color: '#9CA3AF',
          }}>
            <span style={{ fontSize: 48, marginBottom: 12 }}>🎵</span>
            <p style={{ fontSize: 14 }}>공고가 없습니다.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 12,
          }}>
            {sortedItems.map((post) => {
              const payDisplay = (post as any).payText ||
                (post.payType === 'NEGOTIABLE' ? '협의' :
                 post.payType === 'HOURLY' ? `시급 ${post.payMin?.toLocaleString()}원` :
                 post.payType === 'PER_SESSION' ? `회당 ${post.payMin?.toLocaleString()}원` :
                 `월 ${post.payMin?.toLocaleString()}원`);
              return (
                <Link key={post.id} href={`/jobs/${post.id}`}>
                  <PostCard
                    title={post.title}
                    category={post.category}
                    region={post.region ?? ''}
                    pay={payDisplay}
                    noteGrade={post.author?.noteGrade}
                    // TODO: 유료 기능 활성화시 주석 해제
                    // isPremium={post.isPremium}
                  />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
