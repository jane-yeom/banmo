'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { useEffect } from 'react';
import SubHeader from '@/components/layout/SubHeader';

const CATEGORIES = [
  {
    key: 'offer',
    label: '구해요',
    emoji: '🔍',
    desc: '반주자, 레슨, 학원 등 구하는 글',
    href: '/write/jobs?type=offer',
  },
  {
    key: 'seek',
    label: '할게요',
    emoji: '🙋',
    desc: '반주, 레슨, 학원취업 등 제공하는 글',
    href: '/write/jobs?type=seek',
  },
  {
    key: 'board',
    label: '수다방',
    emoji: '💬',
    desc: '자유롭게 이야기를 나눠요',
    href: '/write/board?type=FREE',
  },
  {
    key: 'promo',
    label: '소식',
    emoji: '📢',
    desc: '공연, 연습실, 콩쿨, 오디션 정보',
    href: '/write/promo?category=PROMO_CONCERT',
  },
];

export default function WritePickerPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn) router.replace('/login?redirect=/write');
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F4ED' }}>
      <SubHeader title="글쓰기" />

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 80px' }}>
        <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 24 }}>
          어떤 글을 쓰시겠어요?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => router.push(cat.href)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                background: 'white', borderRadius: 16,
                border: '1px solid #E8E4DC',
                padding: '20px 20px',
                cursor: 'pointer', textAlign: 'left',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: '#F0EDE6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 26, flexShrink: 0,
              }}>
                {cat.emoji}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#1C1C1C', marginBottom: 4 }}>
                  {cat.label}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>
                  {cat.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
