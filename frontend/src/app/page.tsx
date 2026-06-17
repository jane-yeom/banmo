'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import api from '@/lib/axios';
import { Music2, Mic, BookOpen, Star, MessageSquare, MapPin, ChevronRight, Music, Eye, School, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';
import { IconJob, IconPromo, IconBoard } from '@/components/common/SectionIcons';

// 슬라이딩 배너 컴포넌트
function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const touchStartRef = useRef(0);

  const banners = [
    {
      bg: '#1C1C1C',
      Icon: Music2,
      title: '반주자를 찾고 계신가요?',
      sub: '피아노, 바이올린, 첼로 등\n다양한 반주자를 만나보세요',
      btn: '구인 공고 보기',
      href: '/jobs?category=JOB_OFFER',
    },
    {
      bg: '#2C2C2C',
      Icon: Music,
      title: '반주 활동을 원하시나요?',
      sub: '나에게 맞는 연주 기회를\n찾아보세요',
      btn: '구직 공고 보기',
      href: '/jobs?category=JOB_SEEK',
    },
    {
      bg: '#3C3C3C',
      Icon: Star,
      title: '공연을 홍보해보세요',
      sub: '연주회, 공연 소식을\n많은 분들께 알려보세요',
      btn: '공연/연주회 보기',
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

      <b.Icon size={44} strokeWidth={1.5} color="rgba(255,255,255,0.9)" style={{ marginBottom: 12 }} />
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
        background: '#FFFFFF',
        color: '#1C1C1C',
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
    JOB_OFFER: '반주자 구함', JOB_SEEK: '반주 지원',
    LESSON_OFFER: '레슨 구함', LESSON_SEEK: '레슨 지원',
    PERFORMANCE: '공연도우미', AFTERSCHOOL: '방과후교사',
    ACADEMY_OFFER: '학원 채용', ACADEMY_SEEK: '학원 취업',
    ETC: '기타',
    PROMO_CONCERT: '공연/연주회', PROMO_SPACE: '연습실대여',
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
              background: '#F0EDE6', color: '#1C1C1C',
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
              <MapPin size={12} strokeWidth={1.8} color="#6B7280" />
              <span>{post.region || '지역 미정'}</span>
            </div>
          </div>
          <div style={{
            fontSize: 14, fontWeight: 700,
            color: '#1C1C1C', marginLeft: 12,
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
function SectionTitle({ type, title, href }: {
  type: 'job' | 'promo' | 'board'
  title: string
  href: string
}) {
  const iconMap = {
    job:   { Icon: IconJob,   bg: '#F0EDE6' },
    promo: { Icon: IconPromo, bg: '#FEF6E4' },
    board: { Icon: IconBoard, bg: '#EAF6EF' },
  };
  const { Icon, bg } = iconMap[type];

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 14,
    }}>
      <h2 style={{
        fontSize: 17, fontWeight: 700,
        color: '#1A1A1A', margin: 0,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 32, height: 32,
          background: bg, borderRadius: 9,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Icon />
        </div>
        {title}
      </h2>
      <Link href={href} style={{
        fontSize: 13, color: '#000000',
        textDecoration: 'none', fontWeight: 500,
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        더보기 <ChevronRight size={14} strokeWidth={1.8} color="#000000" />
      </Link>
    </div>
  );
}

const TABS = [
  { key: 'offer',   label: '구해요',      cats: 'JOB_OFFER,LESSON_OFFER,PERFORMANCE,AFTERSCHOOL,ETC', href: '/jobs?type=offer' },
  { key: 'seek',    label: '할게요',      cats: 'JOB_SEEK,LESSON_SEEK', href: '/jobs?type=seek' },
  { key: 'board',   label: '수다방',      cats: '', href: '/board' },
  { key: 'promo',   label: '소식',        cats: 'PROMO_CONCERT,PROMO_SPACE', href: '/promo' },
  { key: 'profile', label: '반주자 프로필', cats: '', href: '/profiles' },
] as const;
type TabKey = typeof TABS[number]['key'];

function ProfileCard({ profile }: { profile: any }) {
  const instruments: string[] = Array.isArray(profile.instruments) ? profile.instruments : [];
  return (
    <Link href={`/profile/${profile.id}`} style={{ textDecoration: 'none', flexShrink: 0, width: 160 }}>
      <div style={{
        background: 'white', borderRadius: 16,
        border: '1px solid #E8E4DC',
        padding: '16px 12px', textAlign: 'center',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          width: 60, height: 60, borderRadius: '50%',
          margin: '0 auto 8px', overflow: 'hidden',
          background: '#F0EDE6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #E8E4DC',
        }}>
          {profile.profileImage ? (
            <Image src={profile.profileImage} alt={profile.nickname ?? '?'} width={60} height={60} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
          ) : (
            <span style={{ fontSize: 24, color: '#1C1C1C', fontWeight: 700 }}>
              {(profile.nickname ?? '?')[0]}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
          <NoteGradeBadge grade={profile.noteGrade} showLabel={false} size="sm" />
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1C1C1C', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {profile.nickname ?? '익명'}
        </div>
        {instruments.length > 0 && (
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🎵 {instruments.slice(0, 2).join(' · ')}
          </div>
        )}
        {profile.region && (
          <div style={{ fontSize: 11, color: '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <MapPin size={10} /> {profile.region}
          </div>
        )}
        {profile.bio && (
          <div style={{
            fontSize: 11, color: '#6B7280', marginTop: 6,
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            lineHeight: 1.4, textAlign: 'left',
          }}>
            {profile.bio}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('offer');
  const [tabPosts, setTabPosts] = useState<Record<string, any[]>>({});
  const [publicProfiles, setPublicProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const extract = (res: any) =>
    res.data?.items || res.data?.data || res.data?.posts ||
    (Array.isArray(res.data) ? res.data : []);

  useEffect(() => {
    api.get('/users/public').then((r) => {
      setPublicProfiles(Array.isArray(r.data) ? r.data : []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === 'profile') return;
    if (tabPosts[activeTab]) return; // 캐시 있으면 재요청 안 함
    const tab = TABS.find(t => t.key === activeTab)!;
    if (!tab.cats) return;
    setLoading(true);
    api.get(`/posts?limit=10&status=ACTIVE&categories=${tab.cats}`)
      .then(r => setTabPosts(prev => ({ ...prev, [activeTab]: extract(r) })))
      .catch(() => setTabPosts(prev => ({ ...prev, [activeTab]: [] })))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const posts = tabPosts[activeTab] ?? [];

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4ED' }}>
      <Header />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 16px 80px' }}>
        {/* 슬라이딩 배너 */}
        <HeroBanner />

        {/* 탭 바 */}
        <div style={{
          display: 'flex', gap: 6, marginBottom: 20,
          overflowX: 'auto', scrollbarWidth: 'none',
          paddingBottom: 2,
        }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 99,
                border: 'none',
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                background: activeTab === tab.key ? '#1C1C1C' : 'white',
                color: activeTab === tab.key ? 'white' : '#6B7280',
                boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.18)' : '0 1px 3px rgba(0,0,0,0.07)',
                transition: 'all 0.18s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'profile' ? (
          <div>
            {publicProfiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 14 }}>
                등록된 반주자 프로필이 없습니다
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {publicProfiles.map((profile) => (
                  <Link key={profile.id} href={`/profile/${profile.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'white', borderRadius: 14,
                      border: '1px solid #F3F4F6',
                      padding: '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 14,
                      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}>
                      <div style={{
                        width: 52, height: 52, borderRadius: '50%',
                        background: '#F0EDE6', flexShrink: 0,
                        overflow: 'hidden',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: '1.5px solid #E8E4DC',
                      }}>
                        {profile.profileImage ? (
                          <Image src={profile.profileImage} alt={profile.nickname ?? '?'} width={52} height={52} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        ) : (
                          <span style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1C' }}>{(profile.nickname ?? '?')[0]}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: '#1C1C1C' }}>{profile.nickname ?? '익명'}</span>
                          <NoteGradeBadge grade={profile.noteGrade} showLabel={false} size="sm" />
                        </div>
                        {profile.instruments?.length > 0 && (
                          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 2 }}>🎵 {profile.instruments.slice(0, 3).join(' · ')}</div>
                        )}
                        {profile.bio && (
                          <div style={{ fontSize: 12, color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{profile.bio}</div>
                        )}
                      </div>
                      {profile.region && (
                        <div style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0 }}>{profile.region}</div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'board' ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <span style={{ fontSize: 40 }}>💬</span>
            <p style={{ marginTop: 12, color: '#6B7280', fontSize: 15, fontWeight: 600 }}>수다방</p>
            <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 6 }}>자유롭게 이야기를 나눠보세요</p>
            <Link href="/board" style={{
              display: 'inline-block', marginTop: 16,
              padding: '10px 24px', borderRadius: 99,
              background: '#1C1C1C', color: 'white',
              fontSize: 14, fontWeight: 600, textDecoration: 'none',
            }}>수다방 가기</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
              <Link href={TABS.find(t => t.key === activeTab)!.href} style={{ fontSize: 13, color: '#1C1C1C', textDecoration: 'none', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 2 }}>
                전체보기 <ChevronRight size={14} strokeWidth={1.8} />
              </Link>
            </div>
            {loading ? (
              [1,2,3].map(i => <div key={i} style={{ background: '#E5E7EB', borderRadius: 14, height: 80, marginBottom: 10 }} />)
            ) : posts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF', fontSize: 14, background: 'white', borderRadius: 14 }}>
                등록된 글이 없습니다
              </div>
            ) : (
              posts.map((post: any) => <SectionCard key={post.id} post={post} />)
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
