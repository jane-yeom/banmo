const CATEGORY_LABEL: Record<string, string> = {
  JOB_OFFER: '반주자구인', JOB_SEEK: '반주자구직',
  LESSON_OFFER: '레슨구인', LESSON_SEEK: '레슨구직',
  PERFORMANCE: '공연도우미', AFTERSCHOOL: '방과후',
  PROMO_CONCERT: '연주회홍보', PROMO_SPACE: '연습실대여',
  TRADE_LESSON: '레슨양도', TRADE_SPACE: '연습실양도',
  TRADE_TICKET: '티켓양도', TRADE_INSTRUMENT: '중고악기',
};

const NOTE_GRADE_LABEL: Record<string, string> = {
  NONE: '', BASIC: '♩초급', INTERMEDIATE: '♪중급', ADVANCED: '♫고급', PROFESSIONAL: '♬전문',
};

interface PostCardProps {
  title: string;
  category: string;
  region: string;
  pay?: string;
  noteGrade?: string;
  categoryColor?: string;
  isPremium?: boolean;
}

export default function PostCard({
  title,
  category,
  region,
  pay,
  noteGrade,
  categoryColor = 'bg-violet-100 text-violet-700',
  isPremium = false,
}: PostCardProps) {
  const categoryLabel = CATEGORY_LABEL[category] ?? category;

  return (
    <div className={`group relative rounded-xl bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
      isPremium ? 'border-2 border-amber-400' : 'border border-gray-100'
    }`}>
      {isPremium && (
        <span className="absolute -top-2.5 right-3 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
          👑 프리미엄
        </span>
      )}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryColor}`}>
          {categoryLabel}
        </span>
        {noteGrade && noteGrade !== 'NONE' && NOTE_GRADE_LABEL[noteGrade] && (
          <span className="text-xs text-amber-600 font-medium">{NOTE_GRADE_LABEL[noteGrade]}</span>
        )}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-violet-700 transition-colors">
        {title}
      </h3>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>📍 {region}</span>
        {pay && <span className="font-semibold text-violet-600">{pay}</span>}
      </div>
    </div>
  );
}
