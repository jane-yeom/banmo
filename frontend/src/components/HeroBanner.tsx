'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

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

export function HeroBanner() {
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
      data-testid="hero-banner"
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
      <button aria-label="이전" onClick={prev} style={{
        position: 'absolute', left: 12, top: '50%',
        transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.2)',
        border: 'none', borderRadius: '50%',
        width: 36, height: 36, cursor: 'pointer',
        color: 'white', fontSize: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>‹</button>
      <button aria-label="다음" onClick={next} style={{
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
            aria-label={`슬라이드 ${i + 1}`}
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
