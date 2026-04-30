'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';

interface Notice {
  id: string;
  title: string;
  content: string;
  author: { id: string; nickname: string | null } | null;
  createdAt: string;
}

interface NoticeListResponse {
  data: Notice[];
  total: number;
  page: number;
  totalPages: number;
}

export default function AdminNoticesPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [writeModal, setWriteModal] = useState(false);
  const [editModal, setEditModal] = useState<Notice | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const { data, isLoading } = useQuery<NoticeListResponse>({
    queryKey: ['admin', 'notices', page],
    queryFn: () =>
      apiClient
        .get('/admin/notices', { params: { page, limit: 20 } })
        .then((r) => r.data),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'notices'] });

  const createMut = useMutation({
    mutationFn: (dto: { title: string; content: string }) =>
      apiClient.post('/admin/notices', dto),
    onSuccess: () => {
      setWriteModal(false);
      setTitle('');
      setContent('');
      invalidate();
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: { title?: string; content?: string } }) =>
      apiClient.patch(`/admin/notices/${id}`, dto),
    onSuccess: () => {
      setEditModal(null);
      invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/notices/${id}`),
    onSuccess: invalidate,
  });

  const columns = [
    {
      key: 'no',
      label: '번호',
      width: '60px',
      render: (n: Notice & { _idx: number }) => (
        <span className="text-gray-400 text-sm">{(page - 1) * 20 + n._idx + 1}</span>
      ),
    },
    {
      key: 'title',
      label: '제목',
      render: (n: Notice) => (
        <span className="font-medium text-gray-800">{n.title}</span>
      ),
    },
    {
      key: 'createdAt',
      label: '등록일',
      render: (n: Notice) => (
        <span className="text-gray-500 text-sm">
          {new Date(n.createdAt).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '작업',
      render: (n: Notice) => (
        <div className="flex gap-1">
          <button
            onClick={() => {
              setEditModal(n);
              setTitle(n.title);
              setContent(n.content);
            }}
            className="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-700"
          >
            수정
          </button>
          <button
            onClick={() => {
              if (confirm('공지사항을 삭제하시겠습니까?')) deleteMut.mutate(n.id);
            }}
            className="px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700"
          >
            삭제
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* 상단 버튼 */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            setWriteModal(true);
            setTitle('');
            setContent('');
          }}
          className="px-4 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
        >
          + 새 공지 작성
        </button>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">전체 {data?.total ?? 0}건</span>
        </div>
        <AdminTable
          columns={columns as any}
          data={(data?.data ?? []).map((n, idx) => ({ ...n, _idx: idx }))}
          loading={isLoading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </div>

      {/* 작성 모달 */}
      <AdminModal isOpen={writeModal} onClose={() => setWriteModal(false)} title="새 공지 작성">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지사항 제목"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-violet-400"
          />
          <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공지사항 내용"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-400"
            style={{ height: 200 }}
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setWriteModal(false)}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={() => createMut.mutate({ title, content })}
              disabled={!title || !content || createMut.isPending}
              className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
            >
              등록
            </button>
          </div>
        </div>
      </AdminModal>

      {/* 수정 모달 */}
      <AdminModal isOpen={!!editModal} onClose={() => setEditModal(null)} title="공지 수정">
        {editModal && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:border-violet-400"
            />
            <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-violet-400"
              style={{ height: 200 }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setEditModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => updateMut.mutate({ id: editModal.id, dto: { title, content } })}
                disabled={!title || !content || updateMut.isPending}
                className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                수정
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
