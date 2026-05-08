'use client';

import { useRouter } from 'next/navigation';

interface BackButtonProps {
  href?: string;
  label?: string;
}

export default function BackButton({ href, label }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => (href ? router.push(href) : router.back())}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: 'none', border: 'none',
        color: '#374151', fontSize: 15,
        cursor: 'pointer', padding: '8px 0',
        fontWeight: 500,
      }}
    >
      <span style={{ fontSize: 20 }}>←</span>
      {label && <span>{label}</span>}
    </button>
  );
}
