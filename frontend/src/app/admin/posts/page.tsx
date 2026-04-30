'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';
import { useAdminPosts, AdminPost } from '@/hooks/useAdmin';

const CATEGORY_LABEL: Record<string, string> = {
  JOB_OFFER: '구인', JOB_SEEK: '구직', LESSON_OFFER: '레슨제공',
  LESSON_SEEK: '레슨구함', PERFORMANCE: '연주', AFTERSCHOOL: '방과후',
  PROMO_CONCERT: '공연홍보', PROMO_SPACE: '공간홍보',
  TRADE_LESSON: '레슨교환', TRADE_SPACE: '공간교환',
  TRADE_TICKET: '티켓교환', TRADE_INSTRUMENT: '악기교환',
};
const STATUS_LABEL: Record<string, string> = {
  ACTIVE: '모집중', CLOSED: '마감', HIDDEN: '숨김',
};
const STATUS_COLOR: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-600',
  CLOSED: 'bg-gray-100 text-gray-500',
  HIDDEN: 'bg-red-100 text-red-600',
};
const PAY_LABEL: Record<string, string> = {
  HOURLY: '시급', PER_SESSION: '회당', MONTHLY: '월급', NEGOTIABLE: '협의',
};
const CATEGORY_OPTIONS = Object.entries(CATEGORY_LABEL).map(([v, l]) => ({ value: v, label: l }));

export default function AdminPostsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [deleteModal, setDeleteModal] = useState<AdminPost | null>(null);

  const filters = {
    page,
    search: search || undefined,
    category: category || undefined,
    status: status || undefined,
  };
  const { data, loading } = useAdminPosts(filters);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'posts'] });

  const hideMut = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/posts/${id}/hide`),
    onSuccess: invalidate,
  });
  const showMut = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/posts/${id}/show`),
    onSuccess: invalidate,
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/posts/${id}`),
    onSuccess: () => { setDeleteModal(null); invalidate(); },
  });

  const columns = [
    {
      key: 'no', label: '번호', width: '60px',
      render: (p: AdminPost & { _idx: number }) => (
        <span className="text-gray-400 text-sm">{(page - 1) * 20 + p._idx + 1}</span>
      ),
    },
    {
      key: 'title', label: '제목',
      render: (p: AdminPost) => (
        <span className="font-medium text-gray-800 line-clamp-1">{p.title}</span>
      ),
    },
    {
      key: 'author', label: '작성자',
      render: (p: AdminPost) => (
        <span className="text-gray-600 text-sm">{p.author?.nickname ?? '탈퇴'}</span>
      ),
    },
    {
      key: 'category', label: '카테고리',
      render: (p: AdminPost) => (
        <span className="px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
          {CATEGORY_LABEL[p.category] ?? p.category}
        </span>
      ),
    },
    {
      key: 'pay', label: '페이',
      render: (p: AdminPost) => (
        <span className="text-gray-600 text-sm">
          {PAY_LABEL[p.payType] ?? p.payType} {p.payMin.toLocaleString()}원~
        </span>
      ),
    },
    {
      key: 'status', label: '상태',
      render: (p: AdminPost) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status]}`}>
          {STATUS_LABEL[p.status] ?? p.status}
        </span>
      ),
    },
    {
      key: 'isPremium', label: '프리미엄',
      render: (p: AdminPost) => (
        p.isPremium ? <span className="text-yellow-500">👑</span> : <span className="text-gray-300">-</span>
      ),
    },
    {
      key: 'createdAt', label: '등록일',
      render: (p: AdminPost) => (
        <span className="text-gray-500 text-sm">{new Date(p.createdAt).toLocaleDateString('ko-KR')}</span>
      ),
    },
    {
      key: 'actions', label: '작업',
      render: (p: AdminPost) => (
        <div className="flex gap-1">
          {p.status !== 'HIDDEN' ? (
            <button onClick={() => hideMut.mutate(p.id)}
              className="px-2 py-1 text-xs rounded bg-yellow-100 hover:bg-yellow-200 text-yellow-700">
              숨김
            </button>
          ) : (
            <button onClick={() => showMut.mutate(p.id)}
              className="px-2 py-1 text-xs rounded bg-green-100 hover:bg-green-200 text-green-700">
              공개
            </button>
          )}
          <button onClick={() => setDeleteModal(p)}
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
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="공고 제목 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400"
        />
        <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white">
          <option value="">전체 카테고리</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white">
          <option value="">전체 상태</option>
          <option value="ACTIVE">모집중</option>
          <option value="CLOSED">마감</option>
          <option value="HIDDEN">숨김</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">전체 {data?.total ?? 0}건</span>
        </div>
        <AdminTable
          columns={columns as any}
          data={(data?.data ?? []).map((p, idx) => ({ ...p, _idx: idx }))}
          loading={loading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </div>

      {/* 삭제 확인 모달 */}
      <AdminModal isOpen={!!deleteModal} onClose={() => setDeleteModal(null)} title="공고 삭제">
        {deleteModal && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              <strong className="text-gray-800">{deleteModal.title}</strong> 공고를 삭제하시겠습니까?<br />
              <span className="text-red-500 text-xs">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">취소</button>
              <button onClick={() => deleteMut.mutate(deleteModal.id)}
                disabled={deleteMut.isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                삭제
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
