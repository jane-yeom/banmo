'use client';

import Header from '@/components/layout/Header';
import PostCard from '@/components/common/PostCard';
import Link from 'next/link';
import { usePosts } from '@/hooks/usePosts';
import { useBoardPosts } from '@/hooks/useBoard';
import { useState, useEffect, useRef, useCallback } from 'react';

const banners = [
  {
    bg: 'linear-gradient(135deg, #7C3AED, #5B21B6)',
    icon: '🎹',
    title: '반주자를 찾고 계신가요?',
    subtitle: '피아노, 바이올린, 첼로 등 다양한 반주자를 만나보세요',
    btnText: '구인 공고 보기',
    href: '/jobs?category=JOB_OFFER',
  },
  {
    bg: 'linear-gradient(135deg, #1D4ED8, #1E40AF)',
    icon: '🎵',
    title: '반주 활동을 원하시나요?',
    subtitle: '나에게 맞는 연주 기회를 찾아보세요',
    btnText: '구직 공고 보기',
    href: '/jobs?category=JOB_SEEK',
  },
  {
    bg: 'linear-gradient(135deg, #DB2777, #9D174D)',
    icon: '🎭',
    title: '공연을 홍보해보세요',
    subtitle: '연주회, 공연 소식을 많은 분들께 알려보세요',
    btnText: '공연 홍보 보기',
    href: '/promo',
  },
];

function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const goTo = useCallback((index: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrent(index);
    setTimeout(() => setIsAnimating(false), 400);
  }, [isAnimating]);

  const next = useCallback(() => {
    goTo((current + 1) % banners.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + banners.length) % banners.length);
  }, [current, goTo]);

  useEffect(() => {
    timerRef.current = setInterval(next, 4000);
    return () => clearInterval(timerRef.current);
  }, [next]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) next();
      else prev();
    }
  };

  const banner = banners[current];

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'relative',
        background: banner.bg,
        borderRadius: 16,
        padding: '40px 24px',
        marginBottom: 32,
        minHeight: 240,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        transition: 'background 0.4s ease',
        overflow: 'hidden',
        userSelect: 'none',
      }}>
      <div style={{ fontSize: 48, marginBottom: 12 }}>{banner.icon}</div>
      <h2 style={{
        color: 'white', fontSize: 22, fontWeight: 700,
        marginBottom: 8, lineHeight: 1.3,
      }}>
        {banner.title}
      </h2>
      <p style={{
        color: 'rgba(255,255,255,0.85)', fontSize: 14,
        marginBottom: 24, lineHeight: 1.5,
      }}>
        {banner.subtitle}
      </p>
      <Link href={banner.href} style={{
        background: 'white', color: '#374151',
        padding: '10px 24px', borderRadius: 99,
        fontWeight: 600, fontSize: 14,
        textDecoration: 'none',
        display: 'inline-block',
      }}>
        {banner.btnText} →
      </Link>

      {/* 좌우 화살표 */}
      <button onClick={prev} style={{
        position: 'absolute', left: 12, top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.2)',
        border: 'none', borderRadius: '50%',
        width: 36, height: 36, cursor: 'pointer',
        color: 'white', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>‹</button>
      <button onClick={next} style={{
        position: 'absolute', right: 12, top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.2)',
        border: 'none', borderRadius: '50%',
        width: 36, height: 36, cursor: 'pointer',
        color: 'white', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>›</button>

      {/* dot 인디케이터 */}
      <div style={{
        position: 'absolute', bottom: 12,
        display: 'flex', gap: 6,
      }}>
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            style={{
              width: i === current ? 20 : 8,
              height: 8, borderRadius: 4,
              background: i === current ? 'white' : 'rgba(255,255,255,0.5)',
              border: 'none', cursor: 'pointer',
              transition: 'all 0.3s',
              padding: 0,
            }}/>
        ))}
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />
      ))}
    </div>
  );
}

export default function HomePage() {
  const { data: jobsData, isLoading: jobsLoading } = usePosts({ limit: 3 });
  const { data: promoData, isLoading: promoLoading } = usePosts({ category: 'PROMO_CONCERT', limit: 3 });
  const { data: tradeData, isLoading: tradeLoading } = usePosts({ category: 'TRADE_INSTRUMENT', limit: 3 });
  const { data: boardPosts, isLoading: boardLoading } = useBoardPosts();

  const boardPreview = boardPosts?.slice(0, 3) ?? [];

  const PAY_TYPE_LABEL: Record<string, string> = {
    HOURLY: '시급', PER_SESSION: '회당', MONTHLY: '월급', NEGOTIABLE: '협의',
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* 히어로 배너 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <HeroBanner />
      </section>

      {/* 메인 그리드 */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* 구인구직 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-800">
                <span>🎹</span> 구인구직
              </h2>
              <Link href="/jobs" className="text-xs text-violet-600 hover:text-violet-800 font-medium">
                더보기 →
              </Link>
            </div>
            {jobsLoading ? <SectionSkeleton /> : (
              <div className="flex flex-col gap-2">
                {(jobsData?.items ?? []).map((post) => (
                  <Link key={post.id} href={`/jobs/${post.id}`}>
                    <PostCard
                      title={post.title}
                      category={post.category}
                      region={post.region ?? ''}
                      pay={post.payType === 'NEGOTIABLE' ? '협의' : `${(post.payMin / 10000).toFixed(0)}만원~`}
                      noteGrade={post.author?.noteGrade}
                      // TODO: 유료 기능 활성화시 주석 해제
                      // isPremium={post.isPremium}
                      categoryColor="bg-violet-100 text-violet-700"
                    />
                  </Link>
                ))}
                {!jobsLoading && jobsData?.items.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">공고가 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 공연/연습실 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-800">
                <span>🎵</span> 공연/연습실
              </h2>
              <Link href="/promo" className="text-xs text-pink-600 hover:text-pink-800 font-medium">
                더보기 →
              </Link>
            </div>
            {promoLoading ? <SectionSkeleton /> : (
              <div className="flex flex-col gap-2">
                {(promoData?.items ?? []).map((post) => (
                  <Link key={post.id} href={`/promo/${post.id}`}>
                    <PostCard
                      title={post.title}
                      category={post.category}
                      region={post.region ?? ''}
                      noteGrade={post.author?.noteGrade}
                      // TODO: 유료 기능 활성화시 주석 해제
                      // isPremium={post.isPremium}
                      categoryColor="bg-pink-100 text-pink-700"
                    />
                  </Link>
                ))}
                {!promoLoading && promoData?.items.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">공연/연습실 글이 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 양도/중고 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-800">
                <span>🎸</span> 양도/중고
              </h2>
              <Link href="/trade" className="text-xs text-amber-600 hover:text-amber-800 font-medium">
                더보기 →
              </Link>
            </div>
            {tradeLoading ? <SectionSkeleton /> : (
              <div className="flex flex-col gap-2">
                {(tradeData?.items ?? []).map((post) => (
                  <Link key={post.id} href={`/trade/${post.id}`}>
                    <PostCard
                      title={post.title}
                      category={post.category}
                      region={post.region ?? ''}
                      pay={
                        post.payType === 'NEGOTIABLE' || post.payMin === 0
                          ? '협의'
                          : `${(post.payMin / 10000).toFixed(0)}만원`
                      }
                      categoryColor="bg-amber-100 text-amber-700"
                    />
                  </Link>
                ))}
                {!tradeLoading && tradeData?.items.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">게시글이 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* 게시판 */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-base font-bold text-gray-800">
                <span>📋</span> 게시판
              </h2>
              <Link href="/board" className="text-xs text-teal-600 hover:text-teal-800 font-medium">
                더보기 →
              </Link>
            </div>
            {boardLoading ? <SectionSkeleton /> : (
              <div className="flex flex-col gap-2">
                {boardPreview.map((post) => (
                  <Link key={post.id} href={`/board/${post.id}`}>
                    <div className="rounded-xl bg-white border border-gray-100 p-3 hover:shadow-sm transition-shadow">
                      <p className="line-clamp-2 text-sm font-medium text-gray-800 leading-snug">{post.title}</p>
                      <p className="mt-1 text-xs text-gray-400">
                        {post.isAnonymous ? '익명' : (post.author?.nickname ?? '익명')} ·{' '}
                        {new Date(post.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </Link>
                ))}
                {!boardLoading && boardPreview.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">게시글이 없습니다.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
