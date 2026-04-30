'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';

interface Notice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author?: { nickname: string | null } | null;
}

function useNotices() {
  return useQuery({
    queryKey: ['notices'],
    queryFn: async (): Promise<Notice[]> => {
      const res = await apiClient.get<{ data: Notice[] } | Notice[]>('/board?type=NOTICE');
      const d = res.data as any;
      return Array.isArray(d) ? d : (d?.data ?? []);
    },
    staleTime: 60_000,
  });
}

export default function SupportNoticesPage() {
  const { data: notices, isLoading } = useNotices();
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-2">
          <Link href="/support" className="text-gray-400 hover:text-gray-600 text-sm">고객센터</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-700">공지사항</span>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">📢 공지사항</h1>

        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 border-b border-gray-100 px-5 py-4 animate-pulse bg-gray-50" />
            ))
          ) : !notices?.length ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <span className="text-4xl mb-3">📢</span>
              <p className="text-sm">공지사항이 없습니다.</p>
            </div>
          ) : (
            notices.map((notice, idx) => (
              <button
                key={notice.id}
                onClick={() => setSelectedNotice(notice)}
                className="w-full flex items-center gap-3 border-b border-gray-50 last:border-0 px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                {idx < 3 && <span className="flex-shrink-0 text-amber-500 text-base">📌</span>}
                {idx >= 3 && <span className="flex-shrink-0 w-5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{notice.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <svg className="flex-shrink-0 h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setSelectedNotice(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  {new Date(selectedNotice.createdAt).toLocaleDateString('ko-KR')}
                </p>
                <h2 className="text-base font-bold text-gray-900">{selectedNotice.title}</h2>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                className="text-gray-400 hover:text-gray-600 ml-4 flex-shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="px-6 py-5 max-h-96 overflow-y-auto">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotice.content}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
