import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  sub?: string;
  href?: string;
  btnText?: string;
}

export default function EmptyState({ icon, title, sub, href, btnText }: EmptyStateProps) {
  return (
    <div style={{
      textAlign: 'center',
      padding: '60px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      {icon && <div style={{ fontSize: 48, marginBottom: 4 }}>{icon}</div>}
      <div style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>{title}</div>
      {sub && (
        <div style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.6 }}>{sub}</div>
      )}
      {href && btnText && (
        <Link
          href={href}
          style={{
            marginTop: 12,
            padding: '10px 24px',
            background: '#7B82BE',
            color: 'white',
            borderRadius: 99,
            textDecoration: 'none',
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {btnText}
        </Link>
      )}
    </div>
  );
}
