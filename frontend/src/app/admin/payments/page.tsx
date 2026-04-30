'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';
import { useAdminPayments, useAdminStats, AdminPayment } from '@/hooks/useAdmin';

const TYPE_LABEL: Record<string, string> = {
  PREMIUM_1DAY: '1일 상위노출',
  PREMIUM_7DAY: '7일 상위노출',
  PREMIUM_30DAY: '30일 상위노출',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: '결제대기', SUCCESS: '결제완료', FAILED: '실패', CANCELLED: '취소', REFUNDED: '환불완료',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SUCCESS: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-600',
  REFUNDED: 'bg-gray-100 text-gray-500',
};

export default function AdminPaymentsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [refundModal, setRefundModal] = useState<AdminPayment | null>(null);
  const [refundReason, setRefundReason] = useState('');

  const { data: stats } = useAdminStats();

  const filters = {
    page,
    status: statusFilter || undefined,
    type: typeFilter || undefined,
  };
  const { data, loading } = useAdminPayments(filters);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'payments'] });

  const refundMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/admin/payments/${id}/refund`, { reason }),
    onSuccess: () => {
      setRefundModal(null);
      setRefundReason('');
      invalidate();
    },
  });

  const columns = [
    {
      key: 'no', label: '번호', width: '60px',
      render: (p: AdminPayment & { _idx: number }) => (
        <span className="text-gray-400 text-sm">{(page - 1) * 20 + p._idx + 1}</span>
      ),
    },
    {
      key: 'user', label: '회원',
      render: (p: AdminPayment) => (
        <span className="text-gray-700 text-sm">{p.user?.nickname ?? '탈퇴'}</span>
      ),
    },
    {
      key: 'post', label: '공고제목',
      render: (p: AdminPayment) => (
        <span className="text-gray-700 text-sm line-clamp-1">{p.post?.title ?? '-'}</span>
      ),
    },
    {
      key: 'type', label: '결제유형',
      render: (p: AdminPayment) => (
        <span className="px-2 py-0.5 rounded text-xs bg-violet-100 text-violet-700 whitespace-nowrap">
          {TYPE_LABEL[p.type] ?? p.type}
        </span>
      ),
    },
    {
      key: 'amount', label: '금액',
      render: (p: AdminPayment) => (
        <span className="font-bold text-red-600">{p.amount.toLocaleString()}원</span>
      ),
    },
    {
      key: 'status', label: '상태',
      render: (p: AdminPayment) => (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[p.status]}`}>
          {STATUS_LABEL[p.status] ?? p.status}
        </span>
      ),
    },
    {
      key: 'paidAt', label: '결제일',
      render: (p: AdminPayment) => (
        <span className="text-gray-500 text-sm">
          {p.paidAt ? new Date(p.paidAt).toLocaleDateString('ko-KR') : '-'}
        </span>
      ),
    },
    {
      key: 'actions', label: '작업',
      render: (p: AdminPayment) =>
        p.status === 'SUCCESS' ? (
          <button
            onClick={() => { setRefundModal(p); setRefundReason(''); }}
            className="px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700 font-medium"
          >
            환불
          </button>
        ) : (
          <span className="text-xs text-gray-300">-</span>
        ),
    },
  ];

  return (
    <div>
      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: '전체 결제액',
            value: `${(stats?.payments.totalAmount ?? 0).toLocaleString()}원`,
            color: '#7C3AED',
            bg: '#F5F3FF',
          },
          {
            label: '이번달 결제액',
            value: `${(stats?.payments.thisMonth ?? 0).toLocaleString()}원`,
            color: '#10B981',
            bg: '#ECFDF5',
          },
          {
            label: '환불 건수',
            value: `${data?.data.filter((p) => p.status === 'REFUNDED').length ?? 0}건 (현재 페이지)`,
            color: '#6B7280',
            bg: '#F9FAFB',
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-xl p-5"
            style={{ background: card.bg, border: `1px solid ${card.color}20` }}
          >
            <p className="text-sm text-gray-500 mb-1">{card.label}</p>
            <p className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* 필터 */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
        >
          <option value="">전체 상태</option>
          {Object.entries(STATUS_LABEL).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
        >
          <option value="">전체 유형</option>
          {Object.entries(TYPE_LABEL).map(([v, l]) => (
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
          data={(data?.data ?? []).map((p, idx) => ({ ...p, _idx: idx }))}
          loading={loading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </div>

      {/* 환불 모달 */}
      <AdminModal isOpen={!!refundModal} onClose={() => setRefundModal(null)} title="환불 처리">
        {refundModal && (
          <div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">회원</p>
                  <p className="font-medium text-gray-800">{refundModal.user?.nickname ?? '탈퇴'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">결제유형</p>
                  <p className="font-medium text-gray-800">{TYPE_LABEL[refundModal.type] ?? refundModal.type}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">금액</p>
                  <p className="font-bold text-red-600">{refundModal.amount.toLocaleString()}원</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">공고</p>
                  <p className="font-medium text-gray-800 truncate">{refundModal.post?.title ?? '-'}</p>
                </div>
              </div>
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">환불 사유</label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="환불 사유를 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:border-violet-400 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={() => setRefundModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">취소</button>
              <button
                onClick={() => refundMut.mutate({ id: refundModal.id, reason: refundReason })}
                disabled={!refundReason || refundMut.isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50">
                환불 처리
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  );
}
