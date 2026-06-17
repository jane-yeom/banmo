'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SubHeader from '@/components/layout/SubHeader';
import { useAuthStore } from '@/store/auth.store';
import { useCreateBoardPost } from '@/hooks/useBoard';
import toast from 'react-hot-toast';
import api from '@/lib/axios';
import { X } from 'lucide-react';

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

  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);

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

  const handleTagInput = async (val: string) => {
    setTagInput(val);
    const q = val.startsWith('#') ? val.slice(1) : val;
    if (q.length >= 1) {
      try {
        const res = await api.get(`/board/tags/search?q=${encodeURIComponent(q)}`);
        setTagSuggestions((res.data || []).map((t: any) => t.name));
      } catch {
        setTagSuggestions([]);
      }
    } else {
      setTagSuggestions([]);
    }
  };

  const addTag = (tag: string) => {
    const cleaned = tag.replace(/^#/, '').trim();
    if (!cleaned) return;
    if (tags.includes(cleaned)) { setTagInput(''); setTagSuggestions([]); return; }
    if (tags.length >= 5) { toast.error('태그는 최대 5개까지 가능합니다'); return; }
    if (cleaned.length > 20) { toast.error('태그는 20자 이하로 입력해주세요'); return; }
    setTags(prev => [...prev, cleaned]);
    setTagInput('');
    setTagSuggestions([]);
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const submittingRef = useRef<boolean>(false);

  const handleSubmit = () => {
    if (submittingRef.current) return;
    if (!title.trim() || !content.trim()) {
      toast.error('제목과 내용을 입력해주세요.');
      return;
    }
    submittingRef.current = true;
    createPost.mutate(
      { type, title, content, isAnonymous, tags },
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
          submittingRef.current = false;
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

        {/* 태그 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            태그
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>
              최대 5개, # 없이 입력
            </span>
          </label>

          {tags.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tags.map(tag => (
                <div key={tag} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: '#1C1C1C', color: 'white',
                  borderRadius: 99, padding: '5px 12px',
                  fontSize: 13, fontWeight: 500,
                }}>
                  <span>#</span>{tag}
                  <button onClick={() => removeTag(tag)} style={{
                    background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0,
                    display: 'flex', color: 'rgba(255,255,255,0.7)',
                  }}>
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ position: 'relative' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              padding: '0 14px', background: 'white',
            }}>
              <span style={{ color: '#9CA3AF', fontSize: 16, fontWeight: 600 }}>#</span>
              <input
                value={tagInput}
                onChange={e => handleTagInput(e.target.value)}
                onKeyDown={e => {
                  if ((e.key === 'Enter' || e.key === ' ') && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    addTag(tagInput);
                  }
                }}
                placeholder="태그 입력 후 Enter (예: 반주비, 콩쿠르)"
                maxLength={20}
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  fontSize: 14, padding: '12px 0',
                  background: 'transparent',
                }}
              />
              {tagInput && (
                <button onClick={() => addTag(tagInput)} style={{
                  background: '#1C1C1C', color: 'white',
                  border: 'none', borderRadius: 6,
                  padding: '4px 10px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer',
                }}>
                  추가
                </button>
              )}
            </div>

            {tagSuggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
                background: 'white', border: '1px solid #E8E4DC',
                borderRadius: 10, zIndex: 50, marginTop: 4,
                boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                overflow: 'hidden',
              }}>
                {tagSuggestions.map(tag => (
                  <div key={tag}
                    onClick={() => addTag(tag)}
                    style={{
                      padding: '10px 14px', cursor: 'pointer',
                      fontSize: 14, display: 'flex',
                      alignItems: 'center', gap: 6,
                      borderBottom: '0.5px solid #F4F3F9',
                    }}>
                    <span style={{ color: '#9CA3AF' }}>#</span>
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6 }}>
            💡 Enter 또는 스페이스바로 태그 추가, 최대 5개
          </p>
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
