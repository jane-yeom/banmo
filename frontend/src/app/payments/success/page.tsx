'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import apiClient from '@/lib/axios';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId    = searchParams.get('orderId');
    const amount     = Number(searchParams.get('amount'));

    if (!paymentKey || !orderId || !amount) {
      setStatus('error');
      setErrorMsg('결제 정보가 올바르지 않습니다.');
      return;
    }

    apiClient
      .post('/payments/confirm', { paymentKey, orderId, amount })
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err?.response?.data?.message ?? '결제 승인에 실패했습니다.');
      });
  }, [searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        {status === 'loading' && (
          <>
            <div className="mb-4 flex justify-center">
              <svg className="h-10 w-10 animate-spin text-violet-600" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <p className="text-gray-600">결제 승인 중...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-4 text-6xl">👑</div>
            <h1 className="mb-2 text-xl font-bold text-gray-900">결제 완료!</h1>
            <p className="mb-6 text-sm text-gray-500">
              공고가 상위노출로 등록되었습니다.
            </p>
            <button
              onClick={() => router.push('/jobs')}
              className="w-full rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white hover:bg-violet-800"
            >
              공고 목록 보기
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-4 text-6xl">❌</div>
            <h1 className="mb-2 text-xl font-bold text-gray-900">결제 실패</h1>
            <p className="mb-6 text-sm text-red-500">{errorMsg}</p>
            <button
              onClick={() => router.back()}
              className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
