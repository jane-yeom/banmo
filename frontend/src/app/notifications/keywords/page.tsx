'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';

interface Keyword {
  id: string;
  keyword: string;
  isActive: boolean;
  createdAt: string;
}

const MAX_KEYWORDS = 10;

export default function KeywordsPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();
  const [input, setInput] = useState('');

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const { data: keywords = [], isLoading } = useQuery({
    queryKey: ['keywords'],
    queryFn: () => apiClient.get<Keyword[]>('/keywords').then((r) => r.data),
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: (keyword: string) => apiClient.post('/keywords', { keyword }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keywords'] });
      setInput('');
      toast.success('키워드가 추가되었습니다');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? '추가에 실패했습니다');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/keywords/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keywords'] });
      toast.success('키워드가 삭제되었습니다');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/keywords/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keywords'] }),
  });

  const handleAdd = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (keywords.length >= MAX_KEYWORDS) {
      toast.error(`키워드는 최대 ${MAX_KEYWORDS}개까지 등록 가능합니다`);
      return;
    }
    addMutation.mutate(trimmed);
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-sm text-gray-400 hover:text-gray-600"
        >
          ← 뒤로
        </button>
        <h1 className="text-2xl font-bold text-gray-900">키워드 알림</h1>
        <p className="mt-1 text-sm text-gray-500">
          원하는 키워드를 등록하면 관련 공고가 올라올 때 알려드려요
        </p>
      </div>

      {/* 입력 */}
      <div className="mb-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder='예) 피아노, 강남, 콩쿠르...'
          maxLength={20}
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-violet-400 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim() || addMutation.isPending}
          className="rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50 transition-colors"
        >
          추가
        </button>
      </div>

      {/* 카운트 */}
      <div className="mb-4 text-right text-xs text-gray-400">
        {keywords.length}/{MAX_KEYWORDS}개
      </div>

      {/* 키워드 목록 */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : keywords.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-gray-50 p-10 text-center">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm text-gray-400">등록된 키워드가 없습니다</p>
          <p className="text-xs text-gray-300 mt-1">위에서 키워드를 추가해보세요</p>
        </div>
      ) : (
        <div className="space-y-2">
          {keywords.map((kw) => (
            <div
              key={kw.id}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-colors ${
                kw.isActive ? 'border-violet-100 bg-violet-50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🔍</span>
                <p className={`text-sm font-medium ${kw.isActive ? 'text-violet-700' : 'text-gray-400 line-through'}`}>
                  {kw.keyword}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* 활성화 토글 */}
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={kw.isActive}
                    onChange={() => toggleMutation.mutate(kw.id)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                </label>
                {/* 삭제 */}
                <button
                  onClick={() => deleteMutation.mutate(kw.id)}
                  disabled={deleteMutation.isPending}
                  className="h-6 w-6 flex items-center justify-center rounded-full text-gray-300 hover:bg-gray-200 hover:text-gray-500 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 안내 */}
      <div className="mt-6 rounded-2xl bg-violet-50 border border-violet-100 p-4">
        <p className="text-xs text-violet-600 font-medium mb-1">💡 이렇게 활용해보세요</p>
        <p className="text-xs text-violet-500 leading-relaxed">
          "피아노", "강남", "콩쿠르" 등 원하는 키워드를 등록하면
          해당 단어가 포함된 공고가 올라올 때 알림을 드려요.
        </p>
      </div>
    </div>
  );
}
