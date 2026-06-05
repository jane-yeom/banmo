'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import PostCard from '@/components/common/PostCard';
import { SlidersHorizontal } from 'lucide-react';
import apiClient from '@/lib/axios';
import { Post } from '@/types';
import EmptyState from '@/components/common/EmptyState';

const CATEGORY_TABS = [
  { value: '',              label: '전체' },
  { value: 'JOB_OFFER',    label: '반주자 구인' },
  { value: 'JOB_SEEK',     label: '반주자 구직' },
  { value: 'LESSON_OFFER', label: '레슨 구인' },
  { value: 'LESSON_SEEK',  label: '레슨 구직' },
  { value: 'PERFORMANCE',  label: '공연 도우미' },
  { value: 'AFTERSCHOOL',  label: '방과후 교사' },
  { value: 'ETC',          label: '기타' },
];

const INSTRUMENTS = [
  '피아노', '바이올린', '비올라', '첼로', '콘트라베이스',
  '플루트', '오보에', '클라리넷', '바순', '호른',
  '트럼펫', '트롬본', '타악기', '기타', '하프',
];

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산'];

function SkeletonCard() {
  return (
    <div style={{
      background: 'white', borderRadius: 12,
      padding: '14px', marginBottom: 10,
      border: '0.5px solid #E8E4DC',
    }}>
      <div style={{ height: 14, width: '30%', background: '#F7F4ED', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 16, width: '80%', background: '#F7F4ED', borderRadius: 6, marginBottom: 8, animation: 'pulse 1.5s infinite' }} />
      <div style={{ height: 12, width: '50%', background: '#F7F4ED', borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
    </div>
  );
}

const LIMIT = 10;

export default function JobsPage() {
  const [category, setCategory] = useState('');
  const [instrument, setInstrument] = useState('');
  const [region, setRegion] = useState('');
  const [payMax, setPayMax] = useState(500000);
  const [filterOpen, setFilterOpen] = useState(false);

  const [posts, setPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const observerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef({ category, instrument, region, payMax });

  const buildParams = useCallback((p: number) => {
    const params = new URLSearchParams();
    params.set('page', String(p));
    params.set('limit', String(LIMIT));
    if (filterRef.current.category) params.set('category', filterRef.current.category);
    if (filterRef.current.instrument) params.set('instrument', filterRef.current.instrument);
    if (filterRef.current.region) params.set('region', filterRef.current.region);
    if (filterRef.current.payMax < 500000) params.set('payMax', String(filterRef.current.payMax));
    return params;
  }, []);

  const loadPage = useCallback(async (pageNum: number, reset = false) => {
    setLoading(true);
    try {
      const params = buildParams(pageNum);
      const { data } = await apiClient.get<{ items: Post[]; total: number }>(`/posts?${params}`);
      const newPosts = data.items ?? [];
      setTotal(data.total ?? 0);
      if (reset) {
        setPosts(newPosts);
      } else {
        setPosts((prev) => [...prev, ...newPosts]);
      }
      setHasMore(newPosts.length === LIMIT);
      setPage(pageNum);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [buildParams]);

  // 필터 변경 시 리셋
  useEffect(() => {
    filterRef.current = { category, instrument, region, payMax };
    setInitialLoading(true);
    setPage(1);
    setHasMore(true);
    setPosts([]);
    loadPage(1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, instrument, region, payMax]);

  // Intersection Observer
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPage(page + 1);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loading, page, loadPage]);

  const activeFilters = [instrument, region, payMax < 500000 ? '페이' : ''].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 카테고리 탭 */}
      <div className="sticky top-14 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div
          style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '10px 16px', msOverflowStyle: 'none', scrollbarWidth: 'none' }}
          className="scrollbar-none"
        >
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setCategory(tab.value)}
              style={{
                whiteSpace: 'nowrap', borderRadius: 99, padding: '7px 16px',
                fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', flexShrink: 0,
                background: category === tab.value ? '#1C1C1C' : '#F3F4F6',
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
            {initialLoading ? '로딩 중...' : `총 ${total}건`}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '7px 14px', borderRadius: 8,
                border: '1px solid #E5E7EB',
                background: activeFilters > 0 ? '#F0EDE6' : 'white',
                color: activeFilters > 0 ? '#1C1C1C' : '#374151',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={14} strokeWidth={2} />
              필터{activeFilters > 0 ? ` (${activeFilters})` : ''}
            </button>
            <Link
              href={`/write/jobs?category=${category || 'JOB_OFFER'}`}
              style={{ padding: '7px 14px', borderRadius: 8, background: '#1C1C1C', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              + 공고 작성
            </Link>
          </div>
        </div>

        {/* 필터 패널 */}
        {filterOpen && (
          <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: 16, marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.05em' }}>악기</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {INSTRUMENTS.map((inst) => (
                  <button
                    key={inst}
                    onClick={() => setInstrument(instrument === inst ? '' : inst)}
                    style={{
                      borderRadius: 99, padding: '5px 12px', fontSize: 12, cursor: 'pointer', border: '1px solid',
                      borderColor: instrument === inst ? '#1C1C1C' : '#E5E7EB',
                      background: instrument === inst ? '#1C1C1C' : 'white',
                      color: instrument === inst ? 'white' : '#6B7280',
                    }}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.05em' }}>지역</p>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                style={{ width: '100%', borderRadius: 8, border: '1px solid #E5E7EB', padding: '8px 12px', fontSize: 14, outline: 'none', background: 'white' }}
              >
                <option value="">전체 지역</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', marginBottom: 8, letterSpacing: '0.05em' }}>
                최대 페이: {payMax < 500000 ? `${(payMax / 10000).toFixed(0)}만원` : '무제한'}
              </p>
              <input type="range" min={0} max={500000} step={10000} value={payMax} onChange={(e) => setPayMax(Number(e.target.value))} style={{ width: '100%', accentColor: '#1C1C1C' }} />
            </div>
          </div>
        )}

        {/* 목록 */}
        {initialLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon="🎵"
            title="등록된 공고가 없어요"
            sub="첫 번째 공고를 등록해보세요!"
            href="/jobs/write"
            btnText="공고 등록하기"
          />
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {posts.map((post) => {
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
                    />
                  </Link>
                );
              })}
            </div>
            {/* 무한스크롤 트리거 */}
            <div ref={observerRef} style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                  {Array.from({ length: 2 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              )}
              {!hasMore && posts.length > 0 && (
                <p style={{ fontSize: 12, color: '#9CA3AF' }}>모든 공고를 불러왔습니다</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
