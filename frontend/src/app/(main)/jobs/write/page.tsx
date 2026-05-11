'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function JobsWriteRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/write/jobs');
  }, [router]);
  return null;
}
