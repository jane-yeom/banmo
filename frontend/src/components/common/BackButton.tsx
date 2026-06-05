'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

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
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'none', border: 'none',
        color: '#1A1A1A', cursor: 'pointer',
        padding: '8px 4px',
      }}
    >
      <ChevronLeft size={24} strokeWidth={2} color="#1C1C1C" />
      {label && <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>}
    </button>
  );
}
