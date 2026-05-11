'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function BoardWriteRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'FREE';
  useEffect(() => {
    router.replace(`/write/board?type=${type}`);
  }, [router, type]);
  return null;
}

export default function BoardWriteRedirect() {
  return (
    <Suspense fallback={null}>
      <BoardWriteRedirectContent />
    </Suspense>
  );
}
