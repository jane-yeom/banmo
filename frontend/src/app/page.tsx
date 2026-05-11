'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import api from '@/lib/axios';
import { Music2, Mic, BookOpen, Star, Building2, Guitar, MessageSquare, MessageCircle, LucideIcon } from 'lucide-react';

// 슬라이딩 배너 컴포넌트
function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const touchStartRef = useRef(0);

  const banners = [
    {
      bg: 'linear-gradient(135deg, #7B82BE, #5A63A8)',
      emoji: '🎹',
      title: '반주자를 찾고 계신가요?',
      sub: '피아노, 바이올린, 첼로 등\n다양한 반주자를 만나보세요',
      btn: '구인 공고 보기',
      href: '/jobs?category=JOB_OFFER',
    },
    {
      bg: 'linear-gradient(135deg, #6A8FD4, #4A6AB8)',
      emoji: '🎵',
      title: '반주 활동을 원하시나요?',
      sub: '나에게 맞는 연주 기회를\n찾아보세요',
      btn: '구직 공고 보기',
      href: '/jobs?category=JOB_SEEK',
    },
    {
      bg: 'linear-gradient(135deg, #9070C8, #7050A8)',
      emoji: '🎭',
      title: '공연을 홍보해보세요',
      sub: '연주회, 공연 소식을\n많은 분들께 알려보세요',
      btn: '공연 홍보 보기',
      href: '/promo',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const b = banners[current];

  return (
    <div
      onTouchStart={(e) => { touchStartRef.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchStartRef.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          setCurrent((c) =>
            diff > 0
              ? (c + 1) % banners.length
              : (c - 1 + banners.length) % banners.length
          );
        }
      }}
      style={{
        background: b.bg,
        borderRadius: 20,
        padding: '32px 24px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.5s ease',
        marginBottom: 24,
      }}
    >
      {/* 배경 장식 */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 120, height: 120, borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
      }} />
      <div style={{
        position: 'absolute', bottom: -30, left: -20,
        width: 160, height: 160, borderRadius: '50%',
        background: 'rgba(255,255,255,0.06)',
      }} />

      <div style={{ fontSize: 44, marginBottom: 12 }}>{b.emoji}</div>
      <h2 style={{
        color: 'white', fontSize: 20, fontWeight: 700,
        marginBottom: 8, lineHeight: 1.3,
      }}>
        {b.title}
      </h2>
      <p style={{
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14, marginBottom: 20,
        lineHeight: 1.6, whiteSpace: 'pre-line',
      }}>
        {b.sub}
      </p>
      <Link href={b.href} style={{
        display: 'inline-block',
        background: 'white',
        color: '#5A63A8',
        padding: '10px 24px',
        borderRadius: 99,
        fontWeight: 700,
        fontSize: 14,
        textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      }}>
        {b.btn} →
      </Link>

      {/* 좌우 버튼 */}
      <button
        onClick={() => setCurrent((c) => (c - 1 + banners.length) % banners.length)}
        style={{
          position: 'absolute', left: 8, top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(4px)',
          border: 'none', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer',
          color: 'white', fontSize: 14,
        }}
      >‹</button>
      <button
        onClick={() => setCurrent((c) => (c + 1) % banners.length)}
        style={{
          position: 'absolute', right: 8, top: '50%',
          transform: 'translateY(-50%)',
          background: 'rgba(255,255,255,0.2)',
          backdropFilter: 'blur(4px)',
          border: 'none', borderRadius: '50%',
          width: 32, height: 32, cursor: 'pointer',
          color: 'white', fontSize: 14,
        }}
      >›</button>

      {/* 인디케이터 */}
      <div style={{
        position: 'absolute', bottom: 12,
        left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6,
      }}>
        {banners.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? 20 : 6,
              height: 6, borderRadius: 3,
              background: i === current ? 'white' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// 섹션 카드 컴포넌트
function SectionCard({ post }: { post: any }) {
  const categoryMap: Record<string, string> = {
    JOB_OFFER: '반주자구인', JOB_SEEK: '반주자구직',
    LESSON_OFFER: '레슨구인', LESSON_SEEK: '레슨구직',
    PERFORMANCE: '공연도우미', AFTERSCHOOL: '방과후교사',
    PROMO_CONCERT: '공연홍보', PROMO_SPACE: '연습실대여',
    TRADE_LESSON: '레슨양도', TRADE_SPACE: '연습실양도',
    TRADE_TICKET: '티켓양도', TRADE_INSTRUMENT: '중고악기',
  };

  const payText = post.payText ||
    (post.payType === 'NEGOTIABLE' ? '협의'
    : post.payType === 'HOURLY' ? `시급 ${post.payMin?.toLocaleString()}원`
    : post.payType === 'PER_SESSION' ? `회당 ${post.payMin?.toLocaleString()}원`
    : `월 ${post.payMin?.toLocaleString()}원`);

  return (
    <Link href={`/jobs/${post.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'white',
        borderRadius: 14,
        padding: '16px',
        marginBottom: 10,
        border: '1px solid #F3F4F6',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        cursor: 'pointer',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <span style={{
              display: 'inline-block',
              background: '#ECEAF8', color: '#7B82BE',
              fontSize: 11, fontWeight: 600,
              padding: '3px 8px', borderRadius: 6,
              marginBottom: 8,
            }}>
              {categoryMap[post.category] || post.category}
            </span>
            <div style={{
              fontSize: 15, fontWeight: 600,
              color: '#111827', marginBottom: 6,
              lineHeight: 1.3,
            }}>
              {post.title}
            </div>
            <div style={{
              display: 'flex', alignItems: 'center',
              gap: 4, fontSize: 13, color: '#6B7280',
            }}>
              <span>📍</span>
              <span>{post.region || '지역 미정'}</span>
            </div>
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: '#7B82BE', marginLeft: 12,
            flexShrink: 0,
          }}>
            {payText}
          </div>
        </div>
      </div>
    </Link>
  );
}

// 섹션 타이틀
function SectionTitle({ icon, title, href }: { icon: string; title: string; href: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 14,
    }}>
      <h2 style={{
        fontSize: 17, fontWeight: 700,
        color: '#111827', margin: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>{icon}</span>
        {title}
      </h2>
      <Link href={href} style={{
        fontSize: 13, color: '#7B82BE',
        textDecoration: 'none', fontWeight: 500,
      }}>
        더보기 →
      </Link>
    </div>
  );
}

// 빠른 메뉴
function QuickMenu() {
  const menus = [
    { Icon: Music2, label: '반주자\n구인', href: '/jobs?category=JOB_OFFER', iconBg: '#ECEAF8', iconColor: '#7B82BE' },
    { Icon: Mic, label: '반주자\n구직', href: '/jobs?category=JOB_SEEK', iconBg: '#EAF0FB', iconColor: '#6A8FD4' },
    { Icon: BookOpen, label: '레슨\n구인', href: '/jobs?category=LESSON_OFFER', iconBg: '#EAF6EF', iconColor: '#5AAB7A' },
    { Icon: Star, label: '공연\n홍보', href: '/promo', iconBg: '#FEF6E4', iconColor: '#D4A03A' },
    { Icon: Building2, label: '연습실\n대여', href: '/promo?category=PROMO_SPACE', iconBg: '#F3EAF8', iconColor: '#A06EC0' },
    { Icon: Guitar, label: '중고\n악기', href: '/trade?category=TRADE_INSTRUMENT', iconBg: '#FEF0EA', iconColor: '#D4784A' },
    { Icon: MessageSquare, label: '자유\n게시판', href: '/board?type=FREE', iconBg: '#ECEAF8', iconColor: '#7B82BE' },
    { Icon: MessageCircle, label: '익명\n게시판', href: '/board?type=ANONYMOUS', iconBg: '#F0EAFA', iconColor: '#9070C8' },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}>
        {menus.map((m) => {
          const { Icon } = m;
          return (
            <Link key={m.href} href={m.href} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'white',
                borderRadius: 12,
                padding: '12px 8px',
                textAlign: 'center',
                border: '0.5px solid #DDD9EF',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 34, height: 34,
                  borderRadius: 10,
                  background: m.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 6px',
                }}>
                  <Icon size={20} strokeWidth={1.8} color={m.iconColor} />
                </div>
                <div style={{
                  fontSize: 11, color: '#374151',
                  fontWeight: 500, lineHeight: 1.4,
                  whiteSpace: 'pre-line',
                }}>
                  {m.label}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [jobPosts, setJobPosts] = useState<any[]>([]);
  const [promoPosts, setPromoPosts] = useState<any[]>([]);
  const [tradePosts, setTradePosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [jobs, promo, trade] = await Promise.all([
          api.get('/posts?limit=3&status=ACTIVE').catch(() => ({ data: { data: [] } })),
          api.get('/posts?category=PROMO_CONCERT&limit=3').catch(() => ({ data: { data: [] } })),
          api.get('/posts?category=TRADE_INSTRUMENT&limit=3').catch(() => ({ data: { data: [] } })),
        ]);
        setJobPosts(jobs.data?.items || jobs.data?.data || jobs.data?.posts || []);
        setPromoPosts(promo.data?.items || promo.data?.data || promo.data?.posts || []);
        setTradePosts(trade.data?.items || trade.data?.data || trade.data?.posts || []);
      } catch (e) {
        console.error('홈 데이터 로딩 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <Header />

      <div style={{
        maxWidth: 600,
        margin: '0 auto',
        padding: '16px 16px 80px',
      }}>
        {/* 슬라이딩 배너 */}
        <HeroBanner />

        {/* 빠른 메뉴 */}
        <QuickMenu />

        {/* 구인구직 섹션 */}
        <div style={{ marginBottom: 28 }}>
          <SectionTitle icon="💼" title="구인구직" href="/jobs" />
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} style={{
                background: '#E5E7EB', borderRadius: 14,
                height: 80, marginBottom: 10,
                animation: 'pulse 1.5s infinite',
              }} />
            ))
          ) : jobPosts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '24px',
              color: '#9CA3AF', fontSize: 14,
              background: 'white', borderRadius: 14,
            }}>
              등록된 공고가 없습니다
            </div>
          ) : (
            jobPosts.map((post: any) => <SectionCard key={post.id} post={post} />)
          )}
        </div>

        {/* 공연/연습실 섹션 */}
        <div style={{ marginBottom: 28 }}>
          <SectionTitle icon="🎭" title="공연/연습실" href="/promo" />
          {!loading && promoPosts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '24px',
              color: '#9CA3AF', fontSize: 14,
              background: 'white', borderRadius: 14,
            }}>
              등록된 공연이 없습니다
            </div>
          ) : (
            promoPosts.map((post: any) => <SectionCard key={post.id} post={post} />)
          )}
        </div>

        {/* 중고거래 섹션 */}
        <div style={{ marginBottom: 28 }}>
          <SectionTitle icon="🎸" title="중고악기" href="/trade" />
          {!loading && tradePosts.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '24px',
              color: '#9CA3AF', fontSize: 14,
              background: 'white', borderRadius: 14,
            }}>
              등록된 매물이 없습니다
            </div>
          ) : (
            tradePosts.map((post: any) => <SectionCard key={post.id} post={post} />)
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
