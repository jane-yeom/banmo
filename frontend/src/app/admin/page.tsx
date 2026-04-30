'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useAdminStats } from '@/hooks/useAdmin';

const REASON_LABEL: Record<string, string> = {
  FAKE: '허위공고', PRICE: '부당페이', SPAM: '스팸', ABUSE: '욕설', FRAUD: '사기',
};
const TARGET_LABEL: Record<string, string> = { POST: '공고', USER: '유저', BOARD: '게시글' };
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  REVIEWED: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-green-100 text-green-700',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: '접수중', REVIEWED: '검토중', RESOLVED: '처리완료',
};
const QNA_CAT: Record<string, string> = {
  GENERAL: '일반', PAY: '페이문제', REPORT: '신고', ACCOUNT: '계정', ETC: '기타',
};

function useRecentReports() {
  return useQuery({
    queryKey: ['admin', 'reports', 'recent'],
    queryFn: () => apiClient.get<any[]>('/admin/reports/recent').then((r) => r.data),
    refetchInterval: 30_000,
  });
}

function useRecentQna() {
  return useQuery({
    queryKey: ['admin', 'qna', 'recent'],
    queryFn: () => apiClient.get<any[]>('/admin/qna/recent').then((r) => r.data),
    refetchInterval: 30_000,
  });
}

export default function AdminDashboard() {
  const { data: stats, loading } = useAdminStats();
  const { data: recentReports, isLoading: rLoading } = useRecentReports();
  const { data: recentQna, isLoading: qLoading } = useRecentQna();

  const statCards = stats
    ? [
        {
          label: '전체 회원',
          value: stats.users.total.toLocaleString(),
          sub: `오늘 +${stats.users.today}`,
          color: '#3B82F6',
          bg: '#EFF6FF',
          icon: '👥',
          href: '/admin/users',
        },
        {
          label: '전체 공고',
          value: stats.posts.total.toLocaleString(),
          sub: `오늘 +${stats.posts.today}`,
          color: '#10B981',
          bg: '#ECFDF5',
          icon: '📋',
          href: '/admin/posts',
        },
        {
          label: '처리중 신고',
          value: stats.reports.pending.toLocaleString(),
          sub: `전체 ${stats.reports.total}건`,
          color: '#EF4444',
          bg: '#FEF2F2',
          icon: '🚨',
          href: '/admin/reports',
        },
        {
          label: '미답변 QnA',
          value: stats.qna.pending.toLocaleString(),
          sub: `전체 ${stats.qna.total}건`,
          color: '#F97316',
          bg: '#FFF7ED',
          icon: '💬',
          href: '/admin/qna',
        },
        {
          label: '이번달 결제액',
          value: `${stats.payments.thisMonth.toLocaleString()}원`,
          sub: `전체 ${stats.payments.totalAmount.toLocaleString()}원`,
          color: '#7C3AED',
          bg: '#F5F3FF',
          icon: '💳',
          href: '/admin/payments',
        },
        {
          label: '밴된 회원',
          value: stats.users.banned.toLocaleString(),
          sub: '정지 처리된 계정',
          color: '#6B7280',
          bg: '#F9FAFB',
          icon: '🚫',
          href: '/admin/users?isBanned=true',
        },
      ]
    : [];

  return (
    <div>
      {/* 통계 카드 3x2 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
            ))
          : statCards.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="rounded-xl p-5 block hover:shadow-md transition-shadow"
                style={{ background: card.bg, border: `1px solid ${card.color}20` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <p className="text-sm font-medium text-gray-500">{card.label}</p>
                  <span className="text-2xl">{card.icon}</span>
                </div>
                <p className="text-3xl font-bold" style={{ color: card.color }}>
                  {card.value}
                </p>
                <p className="mt-1 text-xs text-gray-400">{card.sub}</p>
              </Link>
            ))}
      </div>

      {/* 하단 2열 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 최근 신고 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">최근 신고</h2>
            <Link href="/admin/reports" className="text-xs text-violet-600 hover:underline">
              전체 보기 →
            </Link>
          </div>
          {rLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !recentReports?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">신고 없음</p>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r: any) => (
                <div key={r.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600 whitespace-nowrap">
                      {REASON_LABEL[r.reason] ?? r.reason}
                    </span>
                    <span className="text-xs text-gray-500 truncate">
                      {TARGET_LABEL[r.targetType]} · {r.reporter?.nickname ?? '탈퇴'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/admin/reports"
            className="mt-4 block w-full text-center py-2 rounded-lg text-sm font-medium text-violet-600 border border-violet-200 hover:bg-violet-50 transition-colors"
          >
            처리하기
          </Link>
        </div>

        {/* 미답변 QnA */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">미답변 QnA</h2>
            <Link href="/admin/qna" className="text-xs text-violet-600 hover:underline">
              전체 보기 →
            </Link>
          </div>
          {qLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : !recentQna?.length ? (
            <p className="text-sm text-gray-400 text-center py-6">미답변 문의 없음</p>
          ) : (
            <div className="space-y-2">
              {recentQna.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 bg-gray-50">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600 whitespace-nowrap">
                      {QNA_CAT[q.category] ?? q.category}
                    </span>
                    <span className="text-xs text-gray-700 truncate">{q.title}</span>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(q.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/admin/qna"
            className="mt-4 block w-full text-center py-2 rounded-lg text-sm font-medium text-orange-600 border border-orange-200 hover:bg-orange-50 transition-colors"
          >
            답변하기
          </Link>
        </div>
      </div>
    </div>
  );
}
