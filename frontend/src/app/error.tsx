'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Home, RotateCcw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('앱 에러:', error);
  }, [error]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#F4F3F9',
      padding: '20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>😢</div>
      <h1 style={{
        fontSize: 22, fontWeight: 700,
        color: '#1A1A1A', margin: '0 0 10px',
      }}>
        문제가 발생했어요
      </h1>
      <p style={{
        fontSize: 14, color: '#9CA3AF',
        lineHeight: 1.6, marginBottom: 32,
      }}>
        일시적인 오류가 발생했습니다.<br />
        잠시 후 다시 시도해주세요.
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={reset}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '12px 24px',
            background: '#7B82BE', color: 'white',
            border: 'none', borderRadius: 12,
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          <RotateCcw size={16} strokeWidth={2} />
          다시 시도
        </button>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 24px',
          background: 'white', color: '#5A63A8',
          border: '1px solid #DDD9EF',
          borderRadius: 12, textDecoration: 'none',
          fontSize: 14, fontWeight: 700,
        }}>
          <Home size={16} strokeWidth={2} />
          홈으로
        </Link>
      </div>
    </div>
  );
}
