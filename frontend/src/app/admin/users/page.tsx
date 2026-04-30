'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import AdminTable from '@/components/admin/AdminTable';
import AdminModal from '@/components/admin/AdminModal';
import Pagination from '@/components/admin/Pagination';
import { useAdminUsers, AdminUser } from '@/hooks/useAdmin';

const GRADE_LABEL: Record<string, string> = {
  SIXTEENTH: '16분음표', EIGHTH: '8분음표', QUARTER: '4분음표',
  HALF: '2분음표', WHOLE: '온음표',
};
const GRADE_OPTIONS = [
  { value: 'SIXTEENTH', label: '16분음표' },
  { value: 'EIGHTH', label: '8분음표' },
  { value: 'QUARTER', label: '4분음표' },
  { value: 'HALF', label: '2분음표' },
  { value: 'WHOLE', label: '온음표' },
];

export default function AdminUsersPage() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [isBanned, setIsBanned] = useState('');

  const [banModal, setBanModal] = useState<AdminUser | null>(null);
  const [gradeModal, setGradeModal] = useState<AdminUser | null>(null);
  const [detailModal, setDetailModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');

  const filters = {
    page,
    search: search || undefined,
    grade: grade || undefined,
    isBanned: isBanned || undefined,
  };
  const { data, loading } = useAdminUsers(filters);

  const { data: userDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'users', detailModal],
    queryFn: () =>
      detailModal
        ? apiClient.get(`/admin/users/${detailModal}`).then((r) => r.data)
        : null,
    enabled: !!detailModal,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] });

  const banMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.patch(`/admin/users/${id}/ban`, { reason }),
    onSuccess: () => {
      setBanModal(null);
      setBanReason('');
      invalidate();
    },
  });

  const unbanMut = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/admin/users/${id}/unban`),
    onSuccess: invalidate,
  });

  const gradeMut = useMutation({
    mutationFn: ({ id, grade }: { id: string; grade: string }) =>
      apiClient.patch(`/admin/users/${id}/grade`, { grade }),
    onSuccess: () => {
      setGradeModal(null);
      invalidate();
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/users/${id}`),
    onSuccess: invalidate,
  });

  const columns = [
    {
      key: 'no',
      label: '번호',
      width: '60px',
      render: (u: AdminUser & { _idx: number }) => (
        <span className="text-gray-400 text-sm">{(page - 1) * 20 + u._idx + 1}</span>
      ),
    },
    {
      key: 'nickname',
      label: '닉네임',
      render: (u: AdminUser) => (
        <span className="font-medium text-gray-800">{u.nickname ?? '(미설정)'}</span>
      ),
    },
    {
      key: 'email',
      label: '이메일',
      render: (u: AdminUser) => (
        <span className="text-gray-600 text-sm">{u.email ?? '-'}</span>
      ),
    },
    {
      key: 'noteGrade',
      label: '등급',
      render: (u: AdminUser) => (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
          {GRADE_LABEL[u.noteGrade] ?? u.noteGrade}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: '가입일',
      render: (u: AdminUser) => (
        <span className="text-gray-500 text-sm">
          {new Date(u.createdAt).toLocaleDateString('ko-KR')}
        </span>
      ),
    },
    {
      key: 'status',
      label: '상태',
      render: (u: AdminUser) =>
        u.isBanned ? (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
            밴됨
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">
            정상
          </span>
        ),
    },
    {
      key: 'actions',
      label: '작업',
      render: (u: AdminUser) => (
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setDetailModal(u.id)}
            className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            상세
          </button>
          {!u.isBanned ? (
            <button
              onClick={() => {
                setBanModal(u);
                setBanReason('');
              }}
              className="px-2 py-1 text-xs rounded bg-red-100 hover:bg-red-200 text-red-700"
            >
              밴
            </button>
          ) : (
            <button
              onClick={() => unbanMut.mutate(u.id)}
              className="px-2 py-1 text-xs rounded bg-green-100 hover:bg-green-200 text-green-700"
            >
              밴해제
            </button>
          )}
          <button
            onClick={() => {
              setGradeModal(u);
              setSelectedGrade(u.noteGrade);
            }}
            className="px-2 py-1 text-xs rounded bg-blue-100 hover:bg-blue-200 text-blue-700"
          >
            등급조정
          </button>
          <button
            onClick={() => {
              if (confirm('정말 삭제하시겠습니까?')) deleteMut.mutate(u.id);
            }}
            className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600"
          >
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
          placeholder="닉네임 또는 이메일 검색"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400"
        />
        <select
          value={grade}
          onChange={(e) => {
            setGrade(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
        >
          <option value="">전체 등급</option>
          {GRADE_OPTIONS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </select>
        <select
          value={isBanned}
          onChange={(e) => {
            setIsBanned(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-violet-400 bg-white"
        >
          <option value="">전체 상태</option>
          <option value="false">정상</option>
          <option value="true">밴됨</option>
        </select>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm text-gray-500">전체 {data?.total ?? 0}명</span>
        </div>
        <AdminTable
          columns={columns as any}
          data={(data?.data ?? []).map((u, idx) => ({ ...u, _idx: idx }))}
          loading={loading}
        />
        <Pagination page={page} totalPages={data?.totalPages ?? 1} onChange={setPage} />
      </div>

      {/* 밴 모달 */}
      <AdminModal isOpen={!!banModal} onClose={() => setBanModal(null)} title="회원 밴 처리">
        {banModal && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              <strong>{banModal.nickname ?? banModal.email}</strong> 님을 밴 처리합니다.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">밴 사유</label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="밴 사유를 입력하세요"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:border-violet-400"
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setBanModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => banMut.mutate({ id: banModal.id, reason: banReason })}
                disabled={banMut.isPending}
                className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                밴 처리
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* 등급 조정 모달 */}
      <AdminModal isOpen={!!gradeModal} onClose={() => setGradeModal(null)} title="등급 조정">
        {gradeModal && (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              <strong>{gradeModal.nickname ?? gradeModal.email}</strong> 님의 등급을 변경합니다.
            </p>
            <label className="block text-sm font-medium text-gray-700 mb-1">등급 선택</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-violet-400 bg-white"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g.value} value={g.value}>
                  {g.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setGradeModal(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={() => gradeMut.mutate({ id: gradeModal.id, grade: selectedGrade })}
                disabled={gradeMut.isPending}
                className="flex-1 py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
              >
                저장
              </button>
            </div>
          </div>
        )}
      </AdminModal>

      {/* 유저 상세 모달 */}
      <AdminModal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title="회원 상세"
        maxWidth="max-w-2xl"
      >
        {detailLoading ? (
          <div className="py-8 text-center text-gray-400">로딩 중...</div>
        ) : userDetail ? (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                ['닉네임', userDetail.user.nickname ?? '-'],
                ['이메일', userDetail.user.email ?? '-'],
                [
                  '등급',
                  GRADE_LABEL[userDetail.user.noteGrade] ?? userDetail.user.noteGrade,
                ],
                ['신뢰도', `${userDetail.user.trustScore}점`],
                [
                  '가입일',
                  new Date(userDetail.user.createdAt).toLocaleDateString('ko-KR'),
                ],
                ['상태', userDetail.user.isBanned ? '밴됨' : '정상'],
              ].map(([label, value]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-medium text-gray-800">{value}</p>
                </div>
              ))}
            </div>
            {userDetail.user.banReason && (
              <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                <p className="text-xs text-red-400 mb-0.5">밴 사유</p>
                <p className="text-sm text-red-700">{userDetail.user.banReason}</p>
              </div>
            )}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                작성 공고 ({userDetail.posts.length}건)
              </h3>
              {userDetail.posts.length === 0 ? (
                <p className="text-xs text-gray-400">공고 없음</p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {userDetail.posts.map((p: any) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs px-2 py-1.5 bg-gray-50 rounded"
                    >
                      <span className="text-gray-700 truncate flex-1">{p.title}</span>
                      <span className="text-gray-400 ml-2">
                        {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                신고 내역 ({userDetail.reports.length}건)
              </h3>
              {userDetail.reports.length === 0 ? (
                <p className="text-xs text-gray-400">신고 없음</p>
              ) : (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {userDetail.reports.map((r: any) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-xs px-2 py-1.5 bg-red-50 rounded"
                    >
                      <span className="text-red-700">{r.reason}</span>
                      <span className="text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
