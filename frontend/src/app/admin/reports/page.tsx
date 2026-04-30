'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';
import { useAdminReports, AdminReport } from '@/hooks/useAdmin';

const REASON_LABEL: Record<string, string> = {
  FAKE: '허위공고', PRICE: '부당페이', SPAM: '스팸', ABUSE: '욕설', FRAUD: '사기',
};
const TARGET_LABEL: Record<string, string> = { POST: '공고', USER: '유저', BOARD: '게시글' };
const TARGET_COLOR: Record<string, string> = {
  POST: 'bg-blue-100 text-blue-600',
  USER: 'bg-purple-100 text-purple-600',
  BOARD: 'bg-green-100 text-green-600',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: '접수중', REVIEWED: '검토중', RESOLVED: '처리완료',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
};
const ACTIONS = [
  { value: 'BAN_USER', label: '유저 밴' },
  { value: 'DELETE_POST', label: '게시글 삭제' },
  { value: 'HIDE_POST', label: '게시글 숨김' },
  { value: 'WARNING', label: '경고 (신뢰도 -5점)' },
  { value: 'DISMISS', label: '기각' },
];

export default function AdminReportsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [targetType, setTargetType] = useState('');
  const [resolveModal, setResolveModal] = useState<AdminReport | null>(null);
  const [selectedAction, setSelectedAction] = useState('DISMISS');
  const [note, setNote] = useState('');

  const filters = {
    page,
    status: statusFilter || undefined,
    targetType: targetType || undefined,
  };
  const { data, loading } = useAdminReports(filters);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'reports'] });

  const resolveMut = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: string; note: string }) =>
      apiClient.patch(`/admin/reports/${id}/resolve`, { action, note }),
    onSuccess: () => {
      setResolveModal(null);
      setNote('');
      setSelectedAction('DISMISS');
      invalidate();
    },
  });

  const columns = [
    {
      key: 'no', label: '번호', width: '60px',
      render: (r: AdminReport & { _idx: number }) => (
        <span className="text-gray-400 text-sm">{(page - 1) * 20 + r._idx + 1}</span>
      ),
    },
    {
      key: 'reporter', label: '신고자',
      render: (r: AdminReport) => (
        <span className="text-gray-700 text-sm">{r.reporter?.nickname ?? '탈퇴'}</span>
      ),
    },
    {
      key: 'targetType', label: '대상유형',
      render: (r: AdminReport) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TARGET_COLOR[r.targetType] ?? 'bg-gray-100 text-gray-600'}`}>
          {TARGET_LABEL[r.targetType] ?? r.targetType}
        </span>
      ),
    },
    {
      key: 'reason', label: '신고사유',
      render: (r: AdminReport) => (
        <span className="text-gray-700 text-sm">{REASON_LABEL[r.reason] ?? r.reason}</span>
      ),
    },
    {
      key: 'createdAt', label: '접수일',
      render: (r: AdminReport) => (
        <span className="text-gray-500 text-sm">{new Date(r.createdAt).toLocaleDateString('ko-KR')}</span>
      ),
    },
    {
      key: 'status', label: '상태',
      render: (r: AdminReport) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status]}`}>
          {STATUS_LABEL[r.status] ?? r.status}
        </span>
      ),
    },
    {
      key: 'actions', label: '처리',
      render: (r: AdminReport) =>
        r.status === 'PENDING' || r.status === 'REVIEWED' ? (
          <button
            onClick={() => { setResolveModal(r); setSelectedAction('DISMISS'); setNote(''); }}
            className="px-2 py-1 text-xs rounded bg-violet-100 hover:bg-violet-200 text-violet-700 font-medium">
            처리하기
          </button>
        ) : (
          <span className="text-xs text-gray-400">처리완료</span>
        ),
    },
  ];

  return (
    <div>
      {/* 필터 탭 */}
      <div className="flex gap-3 mb-4">
        <div className="flex rounded-lg overflow-hidden border border-gray-200 bg-white">
          {[
            { value: '', label: '전체' },
            { value: 'PENDING', label: '접수중' },
            { value: 'RESOLVED', label: '처리완료' },
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
          value={targetType}
          onChange={(e) => { setTargetType(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
        >
          <option value="">전체 유형</option>
          <option value="POST">공고</option>
          <option value="USER">유저</option>
          <option value="BOARD">게시글</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">전체 {data?.total ?? 0}건</span>
        </div>
        <AdminTable
          columns={columns as any}
          data={(data?.data ?? []).map((r, idx) => ({ ...r, _idx: idx }))}
          loading={loading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </div>

      {/* 처리 모달 */}
      <AdminModal isOpen={!!resolveModal} onClose={() => setResolveModal(null)} title="신고 처리">
        {resolveModal && (
          <div>
            {/* 신고 내용 */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-400 text-xs">신고자</span>
                  <p className="text-gray-800 font-medium">{resolveModal.reporter?.nickname ?? '탈퇴'}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">대상유형</span>
                  <p className="text-gray-800 font-medium">{TARGET_LABEL[resolveModal.targetType]}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">신고사유</span>
                  <p className="text-gray-800 font-medium">{REASON_LABEL[resolveModal.reason] ?? resolveModal.reason}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-xs">접수일</span>
                  <p className="text-gray-800 font-medium">
                    {new Date(resolveModal.createdAt).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
              {resolveModal.description && (
                <div className="mt-3">
                  <span className="text-gray-400 text-xs">상세내용</span>
                  <p className="text-gray-700 text-sm mt-0.5">{resolveModal.description}</p>
                </div>
              )}
            </div>

            {/* 처리 방법 */}
            <label className="block text-sm font-medium text-gray-700 mb-2">처리 방법</label>
            <div className="space-y-2 mb-4">
              {ACTIONS.map((action) => (
                <label key={action.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="action"
                    value={action.value}
                    checked={selectedAction === action.value}
                    onChange={() => setSelectedAction(action.value)}
                    className="accent-violet-600"
                  />
                  <span className="text-sm text-gray-700">{action.label}</span>
                </label>
              ))}
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1">처리 메모</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="처리 메모 (선택)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-20 resize-none focus:outline-none focus:border-violet-400 mb-4"
            />

            <div className="flex gap-2">
              <button onClick={() => setResolveModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">취소</button>
              <button
                onClick={() => resolveMut.mutate({ id: resolveModal.id, action: selectedAction, note })}
                disabled={resolveMut.isPending}
                className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50">
                처리 완료
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
