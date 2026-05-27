'use client';

interface AvatarProps {
  src?: string | null;
  nickname?: string | null;
  size?: number;
}

const COLORS = [
  '#7B82BE', '#5AAB7A', '#D4A03A',
  '#D4784A', '#A06EC0', '#6A8FD4',
];

export default function Avatar({ src, nickname, size = 40 }: AvatarProps) {
  const initial = nickname?.charAt(0)?.toUpperCase() || '?';
  const colorIndex = nickname ? nickname.charCodeAt(0) % COLORS.length : 0;
  const bg = COLORS[colorIndex];

  if (src) {
    return (
      <img
        src={src}
        alt={nickname ?? '프로필'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: size * 0.4,
        fontWeight: 700,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
