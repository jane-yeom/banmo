'use client';

import Header from '@/components/layout/Header';
import PostCard from '@/components/common/PostCard';
import Link from 'next/link';
import { usePosts } from '@/hooks/usePosts';
import { useBoardPosts } from '@/hooks/useBoard';

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
      <section className="bg-gradient-to-br from-violet-700 to-violet-900 py-14 text-center text-white">
        <div className="mx-auto max-w-2xl px-4">
          <p className="mb-2 text-violet-300 text-sm font-medium tracking-widest uppercase">반주의 모든것</p>
          <h1 className="text-4xl font-bold mb-3">🎵 반모</h1>
          <p className="text-violet-200 text-base mb-6">
            반주자와 연주자를 연결하는 매칭 플랫폼입니다.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors shadow"
          >
            지금 시작하기
          </Link>
        </div>
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
