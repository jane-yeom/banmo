'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function QnaRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/support/contact');
  }, [router]);
  return null;
}
