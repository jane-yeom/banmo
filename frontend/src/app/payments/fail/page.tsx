'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const message = searchParams.get('message') ?? '결제가 취소되었거나 실패했습니다.';
  const code    = searchParams.get('code') ?? '';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-lg">
        <div className="mb-4 text-6xl">😢</div>
        <h1 className="mb-2 text-xl font-bold text-gray-900">결제 실패</h1>
        <p className="mb-1 text-sm text-gray-600">{message}</p>
        {code && <p className="mb-6 text-xs text-gray-400">코드: {code}</p>}
        <button
          onClick={() => router.back()}
          className="w-full rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-violet-600" />
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}
