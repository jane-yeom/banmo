'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SubHeader from '@/components/layout/SubHeader';
import { useAuthStore } from '@/store/auth.store';
import { useCreateBoardPost } from '@/hooks/useBoard';
import toast from 'react-hot-toast';

const DRAFT_KEY = 'draft_board';

function WriteBoardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'FREE';
  const { isLoggedIn } = useAuthStore();
  const createPost = useCreateBoardPost();

  const [title, setTitle] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}').title || ''; } catch {}
    }
    return '';
  });
  const [content, setContent] = useState(() => {
    if (typeof window !== 'undefined') {
      try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || '{}').content || ''; } catch {}
    }
    return '';
  });
  const [draftSaved, setDraftSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ title, content }));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch {}
    }, 2000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [title, content]);

  const isAnonymous = type === 'ANONYMOUS';
  const pageTitle = isAnonymous ? '익명게시판 글쓰기' : '자유게시판 글쓰기';

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    createPost.mutate(
      { type, title, content, isAnonymous },
      {
        onSuccess: (res) => {
          localStorage.removeItem(DRAFT_KEY);
          const id = res.data?.id || res.data?.data?.id || res.data?.board?.id;
          if (id) {
            router.replace(`/board/${id}`);
          } else {
            router.replace(`/board?type=${type}`);
          }
        },
        onError: (error: any) => {
          const msg = error?.response?.data?.message || '게시글 등록에 실패했습니다.';
          toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
        },
      },
    );
  };

  if (!isLoggedIn) {
    router.replace('/login');
    return null;
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      <SubHeader
        title={pageTitle}
        rightElement={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {draftSaved && <span style={{ fontSize: 11, color: '#9CA3AF' }}>초안 저장됨</span>}
            <button
              onClick={handleSubmit}
              disabled={createPost.isPending}
              style={{
                padding: '8px 18px',
                background: createPost.isPending ? '#ccc' : '#1C1C1C',
                color: 'white', border: 'none',
                borderRadius: 99, fontSize: 14,
                fontWeight: 700, cursor: createPost.isPending ? 'not-allowed' : 'pointer',
              }}>
              {createPost.isPending ? '등록 중...' : '등록'}
            </button>
          </div>
        }
      />

      <div style={{ padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {isAnonymous && (
          <div style={{
            background: '#F9FAFB', border: '1px solid #E5E7EB',
            borderRadius: 10, padding: '10px 14px',
          }}>
            <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
              🔒 익명으로 게시됩니다. 닉네임이 표시되지 않아요.
            </p>
          </div>
        )}

        {/* 제목 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            제목 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="제목을 입력해주세요"
            maxLength={100}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 내용 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            내용 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="내용을 입력해주세요"
            rows={12}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none',
              resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function WriteBoardPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>로딩 중...</p>
      </div>
    }>
      <WriteBoardContent />
    </Suspense>
  );
}
