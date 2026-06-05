'use client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface SubHeaderProps {
  title: string;
  rightElement?: React.ReactNode;
  hideBack?: boolean;
}

export default function SubHeader({ title, rightElement, hideBack }: SubHeaderProps) {
  const router = useRouter();
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'white',
      borderBottom: '0.5px solid #E8E4DC',
    }}>
      <div style={{
        padding: '12px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        {!hideBack && (
          <button onClick={() => router.back()} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center',
            flexShrink: 0,
          }}>
            <ChevronLeft size={24} color="#1C1C1C" strokeWidth={2} />
          </button>
        )}
        <h1 style={{
          fontSize: 17, fontWeight: 700,
          margin: 0, flex: 1, color: '#1A1A1A',
        }}>
          {title}
        </h1>
        {rightElement}
        <Link href="/" style={{
          textDecoration: 'none', flexShrink: 0,
          display: 'flex', alignItems: 'center',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banmo-logo.png"
            alt="홈"
            style={{ height: 28, width: 'auto', opacity: 0.7 }}
          />
        </Link>
      </div>
    </div>
  );
}
