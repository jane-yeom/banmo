const MIN_HOURLY = 10030;

const PAY_TYPE_LABEL: Record<string, string> = {
  HOURLY: '시급',
  PER_SESSION: '회당',
  MONTHLY: '월급',
  NEGOTIABLE: '협의',
};

interface PayBadgeProps {
  payType: string;
  payMin: number;
  payMax?: number;
}

function formatWon(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}만원`;
  return `${n.toLocaleString()}원`;
}

export default function PayBadge({ payType, payMin, payMax }: PayBadgeProps) {
  const label = PAY_TYPE_LABEL[payType] ?? payType;
  const isLow = payType === 'HOURLY' && payMin < MIN_HOURLY;
  const isNegotiable = payType === 'NEGOTIABLE';

  const colorClass = isLow
    ? 'bg-red-50 text-red-600 border border-red-200'
    : 'bg-violet-50 text-violet-700 border border-violet-200';

  return (
    <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-semibold ${colorClass}`}>
      <span className="text-xs font-normal opacity-70">{label}</span>
      {isNegotiable ? (
        <span>협의</span>
      ) : (
        <span>
          {formatWon(payMin)}
          {payMax && payMax !== payMin && ` ~ ${formatWon(payMax)}`}
        </span>
      )}
      {isLow && <span className="text-xs">⚠️</span>}
    </span>
  );
}
