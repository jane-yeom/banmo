import { Music } from 'lucide-react';

const GRADE_CONFIG = {
  NONE:         { label: '등급없음', icon: '♩', color: '#9CA3AF', bg: '#F3F4F6', border: '#E5E7EB' },
  BASIC:        { label: '초급',    icon: '♩', color: '#5AAB7A', bg: '#EAF6EF', border: '#C0E8D0' },
  INTERMEDIATE: { label: '중급',    icon: '♪', color: '#6A8FD4', bg: '#EAF0FB', border: '#C0D4F0' },
  ADVANCED:     { label: '고급',    icon: '♫', color: '#5A63A8', bg: '#ECEAF8', border: '#C8C4E4' },
  PROFESSIONAL: { label: '전문',    icon: '♬', color: '#D4A03A', bg: '#FEF6E4', border: '#F0DBA0' },
} as const;

type Grade = keyof typeof GRADE_CONFIG;

interface NoteGradeBadgeProps {
  grade: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function NoteGradeBadge({ grade, showLabel = true, size = 'sm' }: NoteGradeBadgeProps) {
  const config = GRADE_CONFIG[grade as Grade] ?? GRADE_CONFIG.NONE;
  const fontSize = size === 'sm' ? 11 : 13;
  const iconSize = size === 'sm' ? 11 : 13;
  const px = size === 'sm' ? '8px' : '10px';
  const py = size === 'sm' ? '2px' : '4px';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: config.bg,
      border: `1px solid ${config.border}`,
      borderRadius: 99,
      padding: `${py} ${px}`,
      fontSize, fontWeight: 600,
      color: config.color,
    }}>
      <Music size={iconSize} strokeWidth={2} color={config.color} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
