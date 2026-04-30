'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import AdminTable from '@/components/admin/AdminTable';
import Pagination from '@/components/admin/Pagination';
import AdminModal from '@/components/admin/AdminModal';
import { useAdminBoards, AdminBoard } from '@/hooks/useAdmin';

const TYPE_LABEL: Record<string, string> = {
  FREE: '자유게시판', ANONYMOUS: '익명게시판',
};
const TYPE_COLOR: Record<string, string> = {
  FREE: 'bg-blue-100 text-blue-600',
  ANONYMOUS: 'bg-gray-100 text-gray-600',
};

export default function AdminBoardsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [commentsBoard, setCommentsBoard] = useState<string | null>(null);
  const [commentsBoardTitle, setCommentsBoardTitle] = useState('');

  const filters = { page, search: search || undefined, type: type || undefined };
  const { data, loading } = useAdminBoards(filters);

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['admin', 'boards', commentsBoard, 'comments'],
    queryFn: () =>
      commentsBoard
        ? apiClient.get(`/admin/boards/${commentsBoard}/comments`).then((r) => r.data)
        : [],
    enabled: !!commentsBoard,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'boards'] });

  const deleteBoardMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/boards/${id}`),
    onSuccess: () => {
      setCommentsBoard(null);
      invalidate();
    },
  });

  const deleteCommentMut = useMutation({
    mutationFn: ({ boardId, commentId }: { boardId: string; commentId: string }) =>
      apiClient.delete(`/admin/boards/${boardId}/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'boards', commentsBoard, 'comments'] }),
  });

  const columns = [
    {
      key: 'no', label: '번호', width: '60px',
      render: (b: AdminBoard & { _idx: number }) => (
        <span className="text-gray-400 text-sm">{(page - 1) * 20 + b._idx + 1}</span>
      ),
    },
    {
      key: 'title', label: '제목',
      render: (b: AdminBoard) => (
        <span className="font-medium text-gray-800">{b.title}</span>
      ),
    },
    {
      key: 'author', label: '작성자',
      render: (b: AdminBoard) => (
        <span className="text-gray-600 text-sm">
          {b.isAnonymous ? '익명' : (b.author?.nickname ?? '탈퇴')}
        </span>
      ),
    },
    {
      key: 'type', label: '타입',
      render: (b: AdminBoard) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLOR[b.type] ?? 'bg-gray-100 text-gray-600'}`}>
          {TYPE_LABEL[b.type] ?? b.type}
        </span>
      ),
    },
    {
      key: 'commentCount', label: '댓글수',
      render: (b: AdminBoard) => (
        <span className="text-gray-600 text-sm">{b.commentCount}개</span>
      ),
    },
    {
      key: 'createdAt', label: '등록일',
      render: (b: AdminBoard) => (
        <span className="text-gray-500 text-sm">{new Date(b.createdAt).toLocaleDateString('ko-KR')}</span>
      ),
    },
    {
      key: 'actions', label: '작업',
      render: (b: AdminBoard) => (
        <div className="flex gap-1">
          <button
            onClick={() => { setCommentsBoard(b.id); setCommentsBoardTitle(b.title); }}
            className="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-700">
            댓글보기
          </button>
          <button
            onClick={() => { if (confirm('게시글을 삭제하시겠습니까?')) deleteBoardMut.mutate(b.id); }}
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
          placeholder="제목 검색"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400"
        />
        <div className="flex rounded-lg overflow-hidden border border-gray-200">
          {[
            { value: '', label: '전체' },
            { value: 'FREE', label: '자유' },
            { value: 'ANONYMOUS', label: '익명' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => { setType(tab.value); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                type === tab.value
                  ? 'bg-violet-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">전체 {data?.total ?? 0}건</span>
        </div>
        <AdminTable
          columns={columns as any}
          data={(data?.data ?? []).map((b, idx) => ({ ...b, _idx: idx }))}
          loading={loading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </div>

      {/* 댓글 모달 */}
      <AdminModal
        isOpen={!!commentsBoard}
        onClose={() => setCommentsBoard(null)}
        title={`댓글 목록 - ${commentsBoardTitle}`}
        maxWidth="max-w-2xl"
      >
        {commentsLoading ? (
          <div className="py-8 text-center text-gray-400">로딩 중...</div>
        ) : !comments?.length ? (
          <div className="py-8 text-center text-gray-400">댓글이 없습니다.</div>
        ) : (
          <div className="space-y-2">
            {comments.map((c: any) => (
              <div key={c.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {c.isAnonymous ? '익명' : (c.author?.nickname ?? '탈퇴')}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                </div>
                <button
                  onClick={() => {
                    if (confirm('댓글을 삭제하시겠습니까?') && commentsBoard) {
                      deleteCommentMut.mutate({ boardId: commentsBoard, commentId: c.id });
                    }
                  }}
                  className="flex-shrink-0 px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </AdminModal>
    </div>
  );
}
