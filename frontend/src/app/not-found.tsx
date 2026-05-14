import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#F4F3F9',
      padding: '20px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 80, marginBottom: 16, lineHeight: 1 }}>🎵</div>
      <h1 style={{
        fontSize: 64, fontWeight: 700,
        color: '#DDD9EF', margin: '0 0 8px',
      }}>
        404
      </h1>
      <h2 style={{
        fontSize: 20, fontWeight: 700,
        color: '#1A1A1A', margin: '0 0 10px',
      }}>
        페이지를 찾을 수 없어요
      </h2>
      <p style={{
        fontSize: 14, color: '#9CA3AF',
        lineHeight: 1.6, marginBottom: 32,
      }}>
        요청하신 페이지가 존재하지 않거나<br />
        삭제된 공고일 수 있어요
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <Link href="/" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 24px',
          background: '#7B82BE', color: 'white',
          borderRadius: 12, textDecoration: 'none',
          fontSize: 14, fontWeight: 700,
        }}>
          <Home size={16} strokeWidth={2} />
          홈으로
        </Link>
        <Link href="/search" style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '12px 24px',
          background: 'white', color: '#5A63A8',
          border: '1px solid #DDD9EF',
          borderRadius: 12, textDecoration: 'none',
          fontSize: 14, fontWeight: 700,
        }}>
          <Search size={16} strokeWidth={2} />
          공고 검색
        </Link>
      </div>
    </div>
  );
}
