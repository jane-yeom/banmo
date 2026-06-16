// TODO: 유료 결제 기능 - 추후 활성화 예정
// 토스페이먼츠 연동 완료 후 jobs/[id]/page.tsx에서 import 주석 해제
// 현재 비활성: jobs/[id]/page.tsx의 PremiumModal import/usage 주석 참고

'use client';

import { useState } from 'react';
import apiClient from '@/lib/axios';

// 카카오 SDK처럼 layout.tsx에서 로드
// <Script src="https://js.tosspayments.com/v1/payment" strategy="afterInteractive" />
declare global {
  interface Window {
    TossPayments: (clientKey: string) => {
      requestPayment: (method: string, params: Record<string, unknown>) => Promise<void>;
    };
  }
}

type PremiumType = 'PREMIUM_1DAY' | 'PREMIUM_7DAY' | 'PREMIUM_30DAY';

const PLANS: { type: PremiumType; label: string; days: number; amount: number; badge: string }[] = [
  { type: 'PREMIUM_1DAY',  label: '1일',  days: 1,  amount: 10_000,  badge: '체험' },
  { type: 'PREMIUM_7DAY',  label: '7일',  days: 7,  amount: 50_000,  badge: '추천' },
  { type: 'PREMIUM_30DAY', label: '30일', days: 30, amount: 150_000, badge: '최고가성비' },
];

interface Props {
  postId: string;
  postTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PremiumModal({ postId, postTitle, onClose, onSuccess }: Props) {
  const [selected, setSelected] = useState<PremiumType>('PREMIUM_7DAY');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS.find((p) => p.type === selected)!;

  const handlePayment = async () => {
    setError(null);
    setLoading(true);

    try {
      // 1. 백엔드에서 주문번호 발급
      const { data } = await apiClient.post<{ orderId: string; amount: number; orderName: string }>(
        '/payments/request',
        { postId, type: selected },
      );

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) throw new Error('NEXT_PUBLIC_TOSS_CLIENT_KEY가 설정되지 않았습니다.');
      if (!window.TossPayments) throw new Error('토스페이먼츠 SDK가 로드되지 않았습니다.');

      const toss = window.TossPayments(clientKey);

      // 2. 토스 결제창 열기 (결제 성공 시 successUrl로 리다이렉트)
      await toss.requestPayment('카드', {
        amount:       data.amount,
        orderId:      data.orderId,
        orderName:    data.orderName,
        customerName: '반모 사용자',
        successUrl: `${window.location.origin}/payments/success`,
        failUrl:    `${window.location.origin}/payments/fail`,
      });
    } catch (err: any) {
      // 사용자가 결제창을 닫으면 여기로 옴 (정상 취소)
      const msg = err?.message ?? '';
      if (msg.includes('취소') || msg.includes('cancel') || msg.includes('PAY_PROCESS_CANCELED')) {
        setError(null);
      } else {
        setError(err?.response?.data?.message ?? err?.message ?? '결제 요청에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="rounded-t-2xl px-6 py-5 text-white" style={{ background: '#1C1C1C' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs mb-1" style={{ color: '#ECEAE4' }}>상위노출 신청</p>
              <h2 className="text-lg font-bold">👑 프리미엄 공고</h2>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white text-xl">✕</button>
          </div>
          <p className="mt-2 text-sm truncate" style={{ color: '#ECEAE4' }}>📋 {postTitle}</p>
        </div>

        <div className="p-6">
          {/* 혜택 안내 */}
          <div className="mb-5 rounded-xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-sm font-semibold text-amber-800 mb-2">👑 프리미엄 혜택</p>
            <ul className="space-y-1 text-xs text-amber-700">
              <li>✓ 검색 결과 최상단 고정 노출</li>
              <li>✓ 왕관 배지로 신뢰도 강조</li>
              <li>✓ 지원자 수 최대 3배 증가 효과</li>
            </ul>
          </div>

          {/* 플랜 선택 */}
          <div className="space-y-2 mb-6">
            {PLANS.map((p) => (
              <label
                key={p.type}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                  selected === p.type
                    ? 'border-[#1C1C1C] bg-[#F7F4ED]'
                    : 'border-gray-200 hover:border-[#1C1C1C]'
                }`}
              >
                <input
                  type="radio"
                  name="plan"
                  value={p.type}
                  checked={selected === p.type}
                  onChange={() => setSelected(p.type)}
                  className="hidden"
                />
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  selected === p.type ? 'border-[#1C1C1C]' : 'border-gray-300'
                }`}>
                  {selected === p.type && (
                    <div className="h-2.5 w-2.5 rounded-full bg-[#1C1C1C]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{p.label}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.badge === '추천'
                        ? 'bg-[#ECEAE4] text-[#1C1C1C]'
                        : p.badge === '최고가성비'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    일 {(p.amount / p.days / 10000).toFixed(1)}만원 · {p.days}일간 상위노출
                  </p>
                </div>
                <span className="font-bold text-gray-900 flex-shrink-0">
                  {(p.amount / 10000).toFixed(0)}만원
                </span>
              </label>
            ))}
          </div>

          {error && (
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}

          {/* 결제 버튼 */}
          <button
            onClick={handlePayment}
            disabled={loading}
            className="w-full rounded-xl py-4 text-base font-bold text-white transition-colors disabled:opacity-60" style={{ background: '#1C1C1C' }}
          >
            {loading
              ? '결제창 로딩 중...'
              : `${(plan.amount / 10000).toFixed(0)}만원 결제하기`}
          </button>
          <p className="mt-2 text-center text-xs text-gray-400">
            토스페이먼츠 안전 결제 · 카드/간편결제 지원
          </p>
        </div>
      </div>
    </div>
  );
}
