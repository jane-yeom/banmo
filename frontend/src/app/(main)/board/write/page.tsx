'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useCreateBoardPost } from '@/hooks/useBoard';
import BackButton from '@/components/common/BackButton';

function BoardWriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'FREE';
  const { user } = useAuthStore();
  const createPost = useCreateBoardPost();

  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && !user) router.replace('/login');
  }, [mounted, user, router]);

  if (!mounted || !user) return null;

  const isAnonymous = type === 'ANONYMOUS';
  const pageTitle = isAnonymous ? '익명게시판 글쓰기' : '자유게시판 글쓰기';

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요.');
      return;
    }
    setError('');
    const payload = { type, title, content, isAnonymous };
    createPost.mutate(payload, {
      onSuccess: (res) => router.push(`/board/${res.data.id}`),
      onError: (error: any) => {
        const msg = error?.response?.data?.message || '게시글 등록에 실패했습니다.';
        toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
      },
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {/* 상단 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: 12, marginBottom: 20, padding: '8px 0',
      }}>
        <BackButton />
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
          {pageTitle}
        </h1>
      </div>

      {isAnonymous && (
        <div className="mb-4 rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
          <p className="text-xs text-gray-500">익명게시판에서는 닉네임이 표시되지 않습니다.</p>
        </div>
      )}

      <div className="space-y-4">
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

export default function BoardWritePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-sm">로딩 중...</div>
      </div>
    }>
      <BoardWriteContent />
    </Suspense>
  );
}
