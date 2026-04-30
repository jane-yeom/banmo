'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';
import { useAdminQna, AdminQna } from '@/hooks/useAdmin';

const CAT_LABEL: Record<string, string> = {
  GENERAL: '일반', PAY: '페이문제', REPORT: '신고', ACCOUNT: '계정', ETC: '기타',
};
const CAT_COLOR: Record<string, string> = {
  GENERAL: 'bg-blue-100 text-blue-600',
  PAY: 'bg-red-100 text-red-600',
  REPORT: 'bg-orange-100 text-orange-600',
  ACCOUNT: 'bg-green-100 text-green-600',
  ETC: 'bg-gray-100 text-gray-600',
};
const STATUS_LABEL: Record<string, string> = { PENDING: '접수중', ANSWERED: '답변완료' };
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  ANSWERED: 'bg-green-100 text-green-700',
};

export default function AdminQnaPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [category, setCategory] = useState('');
  const [answerModal, setAnswerModal] = useState<AdminQna | null>(null);
  const [answer, setAnswer] = useState('');

  const filters = {
    page,
    status: statusFilter || undefined,
    category: category || undefined,
  };
  const { data, loading } = useAdminQna(filters);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'qna'] });

  const answerMut = useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      apiClient.patch(`/admin/qna/${id}/answer`, { answer }),
    onSuccess: () => {
      setAnswerModal(null);
      setAnswer('');
      invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/qna/${id}`),
    onSuccess: invalidate,
  });

  const columns = [
    {
      key: 'no', label: '번호', width: '60px',
      render: (q: AdminQna & { _idx: number }) => (
        <span className="text-gray-400 text-sm">{(page - 1) * 20 + q._idx + 1}</span>
      ),
    },
    {
      key: 'title', label: '제목',
      render: (q: AdminQna) => (
        <span className="font-medium text-gray-800">{q.title}</span>
      ),
    },
    {
      key: 'category', label: '카테고리',
      render: (q: AdminQna) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${CAT_COLOR[q.category] ?? 'bg-gray-100 text-gray-600'}`}>
          {CAT_LABEL[q.category] ?? q.category}
        </span>
      ),
    },
    {
      key: 'author', label: '작성자',
      render: (q: AdminQna) => (
        <div className="text-sm">
          <p className="text-gray-700">{q.author?.nickname ?? q.authorName ?? '-'}</p>
          <p className="text-gray-400 text-xs">{q.authorEmail}</p>
        </div>
      ),
    },
    {
      key: 'createdAt', label: '접수일',
      render: (q: AdminQna) => (
        <span className="text-gray-500 text-sm">{new Date(q.createdAt).toLocaleDateString('ko-KR')}</span>
      ),
    },
    {
      key: 'status', label: '상태',
      render: (q: AdminQna) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[q.status]}`}>
          {STATUS_LABEL[q.status] ?? q.status}
        </span>
      ),
    },
    {
      key: 'actions', label: '작업',
      render: (q: AdminQna) => (
        <div className="flex gap-1">
          <button
            onClick={() => { setAnswerModal(q); setAnswer(q.answer ?? ''); }}
            className="px-2 py-1 text-xs rounded bg-violet-100 hover:bg-violet-200 text-violet-700">
            {q.status === 'ANSWERED' ? '답변수정' : '답변하기'}
          </button>
          <button
            onClick={() => { if (confirm('삭제하시겠습니까?')) deleteMut.mutate(q.id); }}
            className="px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700">
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* 필터 */}
      <div className="flex gap-3 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
          {[
            { value: '', label: '전체' },
            { value: 'PENDING', label: '접수중' },
            { value: 'ANSWERED', label: '답변완료' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setStatusFilter(tab.value); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
        >
          <option value="">전체 카테고리</option>
          {Object.entries(CAT_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">전체 {data?.total ?? 0}건</span>
        </div>
        <AdminTable
          columns={columns as any}
          data={(data?.data ?? []).map((q, idx) => ({ ...q, _idx: idx }))}
          loading={loading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </div>

      {/* 답변 모달 */}
      <AdminModal
        isOpen={!!answerModal}
        onClose={() => setAnswerModal(null)}
        title="QnA 답변"
        maxWidth="max-w-2xl"
      >
        {answerModal && (
          <div>
            <div className="mb-4">
              <h3 className="text-base font-semibold text-gray-800 mb-1">{answerModal.title}</h3>
              <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                <span className={`px-2 py-0.5 rounded-full font-medium ${CAT_COLOR[answerModal.category]}`}>
                  {CAT_LABEL[answerModal.category]}
                </span>
                <span>{answerModal.author?.nickname ?? answerModal.authorName ?? answerModal.authorEmail}</span>
                <span>{new Date(answerModal.createdAt).toLocaleDateString('ko-KR')}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                {answerModal.content}
              </div>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">답변</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="답변을 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-32 resize-none focus:outline-none focus:border-violet-400 mb-4"
            />

            <div className="flex gap-2">
              <button onClick={() => setAnswerModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">취소</button>
              <button
                onClick={() => answerMut.mutate({ id: answerModal.id, answer })}
                disabled={!answer || answerMut.isPending}
                className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                답변 등록
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
