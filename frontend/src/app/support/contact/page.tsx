'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';

interface MyQna {
  id: string;
  title: string;
  content: string;
  category: string;
  status: 'PENDING' | 'ANSWERED';
  answer: string | null;
  answeredAt: string | null;
  isPrivate: boolean;
  authorName: string | null;
  authorEmail: string;
  createdAt: string;
}

const CATEGORY_OPTIONS = [
  { value: 'GENERAL', label: '일반문의' },
  { value: 'PAY', label: '페이문제' },
  { value: 'REPORT', label: '신고문의' },
  { value: 'ACCOUNT', label: '계정문제' },
  { value: 'ETC', label: '기타' },
];
const CATEGORY_COLOR: Record<string, string> = {
  GENERAL: 'bg-blue-50 text-blue-600',
  PAY: 'bg-yellow-50 text-yellow-600',
  REPORT: 'bg-red-50 text-red-600',
  ACCOUNT: 'bg-purple-50 text-purple-600',
  ETC: 'bg-gray-50 text-gray-500',
};

function useMyQnas() {
  return useQuery({
    queryKey: ['qna', 'my'],
    queryFn: (): Promise<MyQna[]> =>
      apiClient
        .get<{ success: boolean; data: MyQna[] } | MyQna[]>('/qna/my')
        .then((r) => {
          const d = r.data as any;
          return Array.isArray(d) ? (d as MyQna[]) : ((d?.data ?? []) as MyQna[]);
        }),
  });
}

export default function SupportContactPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'GENERAL',
    authorName: '',
    authorEmail: user?.email ?? '',
    isPrivate: true,
  });

  const { data: qnas, isLoading } = useMyQnas();

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => apiClient.post('/qna', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['qna', 'my'] });
      setShowForm(false);
      setForm({
        title: '',
        content: '',
        category: 'GENERAL',
        authorName: '',
        authorEmail: user?.email ?? '',
        isPrivate: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || !form.authorEmail.trim()) return;
    createMutation.mutate(form);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="mx-auto max-w-2xl flex items-center gap-2">
          <Link href="/support" className="text-gray-400 hover:text-gray-600 text-sm">고객센터</Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-700">문의하기</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">✉️ 문의하기</h1>
            <p className="mt-1 text-sm text-gray-500">궁금한 점이나 문제를 문의해주세요.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-violet-700 hover:bg-violet-800"
          >
            {showForm ? '취소' : '문의하기'}
          </button>
        </div>

        {/* 문의 작성 폼 */}
        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-6 mb-6 space-y-4"
          >
            <h2 className="text-base font-semibold text-gray-800">문의 작성</h2>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">카테고리</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">제목</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="문의 제목을 입력하세요"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">내용</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="문의 내용을 자세히 입력해주세요"
                rows={5}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm resize-none focus:border-violet-400 focus:outline-none"
                required
              />
            </div>

            {!user && (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">이름</label>
                <input
                  value={form.authorName}
                  onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                  placeholder="이름을 입력하세요"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                답변 받을 이메일 {!user && <span className="text-red-500">*</span>}
              </label>
              <input
                type="email"
                value={form.authorEmail}
                onChange={(e) => setForm({ ...form, authorEmail: e.target.value })}
                placeholder="이메일 주소"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none"
                required
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPrivate}
                onChange={(e) => setForm({ ...form, isPrivate: e.target.checked })}
                className="accent-violet-600"
              />
              <span className="text-sm text-gray-600">비공개 문의</span>
            </label>

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-lg bg-violet-700 py-2.5 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-50"
            >
              문의 등록
            </button>
          </form>
        )}

        {/* 내 문의 목록 */}
        {user ? (
          <div className="space-y-3">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
              ))
            ) : !qnas?.length ? (
              <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
                <p className="text-gray-400 text-sm">문의 내역이 없습니다.</p>
                <p className="text-gray-300 text-xs mt-1">궁금한 점을 문의해보세요.</p>
              </div>
            ) : (
              qnas.map((qna) => (
                <div key={qna.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
                  <button
                    onClick={() => setExpandedId(expandedId === qna.id ? null : qna.id)}
                    className="w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium flex-shrink-0 ${CATEGORY_COLOR[qna.category]}`}>
                      {CATEGORY_OPTIONS.find((o) => o.value === qna.category)?.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{qna.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(qna.createdAt).toLocaleDateString('ko-KR')}
                        {qna.isPrivate && ' · 🔒 비공개'}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      qna.status === 'ANSWERED'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-yellow-100 text-yellow-600'
                    }`}>
                      {qna.status === 'ANSWERED' ? '답변완료' : '접수중'}
                    </span>
                  </button>

                  {expandedId === qna.id && (
                    <div className="border-t border-gray-100 p-4 space-y-4">
                      <div>
                        <p className="text-xs font-medium text-gray-400 mb-1">문의 내용</p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{qna.content}</p>
                      </div>
                      {qna.status === 'ANSWERED' && qna.answer && (
                        <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
                          <p className="text-xs font-medium text-violet-600 mb-1">
                            관리자 답변 · {qna.answeredAt && new Date(qna.answeredAt).toLocaleDateString('ko-KR')}
                          </p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{qna.answer}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
            <p className="text-gray-500 text-sm">로그인하면 문의 내역을 확인할 수 있습니다.</p>
            <p className="text-gray-400 text-xs mt-1">비로그인 상태에서도 문의 등록은 가능합니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
