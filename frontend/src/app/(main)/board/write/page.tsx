'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useCreateBoardPost } from '@/hooks/useBoard';

const TYPES = [
  { value: 'FREE',      label: '자유게시판' },
  { value: 'ANONYMOUS', label: '익명게시판' },
];

export default function BoardWritePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createPost = useCreateBoardPost();

  const [mounted, setMounted] = useState(false);
  const [type, setType] = useState('FREE');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !user) router.replace('/login');
  }, [mounted, user, router]);

  if (!mounted || !user) return null;

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }
    setError('');
    const payload = { type, title, content };
    console.log('[Board Write] 제출 데이터:', payload);
    createPost.mutate(payload, {
      onSuccess: (res) => router.push(`/board/${res.data.id}`),
      onError: (error: any) => {
        const msg = error?.response?.data?.message || '게시글 등록에 실패했습니다.';
        console.error('[에러]', error?.response?.data);
        toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-xl font-bold text-gray-900">게시글 작성</h1>

      <div className="space-y-4">
        {/* 게시판 유형 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">게시판</label>
          <div className="flex gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  type === t.value
                    ? 'bg-teal-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {type === 'ANONYMOUS' && (
            <p className="mt-1.5 text-xs text-gray-400">익명게시판에서는 닉네임이 표시되지 않습니다.</p>
          )}
        </div>

        {/* 제목 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-teal-400 focus:outline-none"
          />
        </div>

        {/* 내용 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            placeholder="내용을 입력하세요"
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-teal-400 focus:outline-none"
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => router.back()}
            className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={createPost.isPending}
            className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {createPost.isPending ? '등록 중...' : '등록하기'}
          </button>
        </div>
      </div>
    </div>
  );
}
