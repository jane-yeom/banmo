const GRADE_CONFIG = {
  NONE:         { label: '등급없음', icon: '𝅝',  color: 'bg-gray-100 text-gray-400' },
  BASIC:        { label: '초급',    icon: '♩',  color: 'bg-green-100 text-green-700' },
  INTERMEDIATE: { label: '중급',    icon: '♪',  color: 'bg-blue-100 text-blue-700' },
  ADVANCED:     { label: '고급',    icon: '♫',  color: 'bg-violet-100 text-violet-700' },
  PROFESSIONAL: { label: '전문',    icon: '♬',  color: 'bg-amber-100 text-amber-700' },
} as const;

type Grade = keyof typeof GRADE_CONFIG;

interface NoteGradeBadgeProps {
  grade: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export default function NoteGradeBadge({ grade, showLabel = true, size = 'sm' }: NoteGradeBadgeProps) {
  const config = GRADE_CONFIG[grade as Grade] ?? GRADE_CONFIG.NONE;
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${sizeClass}`}>
      <span>{config.icon}</span>
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
