'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Heart, Bell, Key, ClipboardList, Inbox } from 'lucide-react';
import SubHeader from '@/components/layout/SubHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Post } from '@/types';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';

type AppStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

interface Application {
  id: string;
  postId: string;
  post: Post;
  applicant: { id: string; nickname: string | null; profileImage: string | null };
  message: string | null;
  status: AppStatus;
  createdAt: string;
}

const STATUS_LABEL: Record<AppStatus, { label: string; color: string }> = {
  PENDING:  { label: '대기중',  color: 'bg-yellow-100 text-yellow-700' },
  ACCEPTED: { label: '합격',    color: 'bg-green-100 text-green-700' },
  REJECTED: { label: '불합격',  color: 'bg-red-100 text-red-600' },
};

const CATEGORY_LABEL: Record<string, string> = {
  JOB_OFFER: '반주자구인', JOB_SEEK: '반주자구직',
  LESSON_OFFER: '레슨구인', LESSON_SEEK: '레슨구직',
  PERFORMANCE: '공연도우미', AFTERSCHOOL: '방과후',
  PROMO_CONCERT: '연주회홍보', PROMO_SPACE: '연습실대여',
  TRADE_LESSON: '레슨양도', TRADE_SPACE: '연습실양도',
  TRADE_TICKET: '티켓양도', TRADE_INSTRUMENT: '중고악기',
};

type Tab = 'posts' | 'applied' | 'received';

interface ApplicantProfile {
  id: string;
  nickname: string | null;
  profileImage: string | null;
  noteGrade: string;
  trustScore: number;
  instruments: string[] | null;
  bio: string | null;
  isVerified?: boolean;
}

function ApplicantProfileModal({
  applicantId,
  onClose,
}: {
  applicantId: string;
  onClose: () => void;
}) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['applicantProfile', applicantId],
    queryFn: () =>
      apiClient.get<ApplicantProfile>(`/users/${applicantId}`).then((r) => r.data),
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl bg-white p-6 shadow-xl"
        style={{ maxHeight: '80vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-900">지원자 프로필</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={20} color="#6B7280" />
          </button>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : profile ? (
          <>
            <div className="mb-4 flex items-center gap-4">
              <div
                className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full text-2xl font-bold overflow-hidden"
                style={{ background: '#ECEAF8', color: '#7B82BE' }}
              >
                {profile.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.profileImage} alt="프로필" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  (profile.nickname ?? '?')[0]
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold text-gray-900">{profile.nickname ?? '익명'}</p>
                  {profile.isVerified && (
                    <span style={{ fontSize: 11, background: '#EAF6EF', color: '#5AAB7A', border: '1px solid #5AAB7A', borderRadius: 99, padding: '2px 8px', fontWeight: 700 }}>
                      ✓ 인증
                    </span>
                  )}
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <NoteGradeBadge grade={profile.noteGrade as any} />
                  <span className="text-xs text-gray-400">신뢰점수 {profile.trustScore?.toFixed(1)}</span>
                </div>
              </div>
            </div>
            {profile.instruments && profile.instruments.length > 0 && (
              <div className="mb-3">
                <p className="mb-1 text-xs font-semibold text-gray-500">담당 악기</p>
                <div className="flex flex-wrap gap-1">
                  {profile.instruments.map((inst) => (
                    <span key={inst} className="rounded-full px-3 py-1 text-xs font-medium" style={{ background: '#ECEAF8', color: '#7B82BE' }}>
                      {inst}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.bio && (
              <div className="mb-4 rounded-xl bg-gray-50 p-3">
                <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
              </div>
            )}
            <Link
              href={`/profile/${applicantId}`}
              onClick={onClose}
              className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #7B82BE, #5A63A8)' }}
            >
              전체 프로필 보기
            </Link>
          </>
        ) : (
          <p className="py-8 text-center text-sm text-gray-400">프로필을 불러올 수 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default function MyPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('posts');
  const [selectedApplicantId, setSelectedApplicantId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const { data: myPosts } = useQuery({
    queryKey: ['myPosts'],
    queryFn: () =>
      apiClient
        .get<{ items: Post[]; total: number }>(`/posts?authorId=${user?.id}&limit=50&status=ALL`)
        .then((r) => r.data),
    enabled: !!user && tab === 'posts',
  });

  const { data: myApplications } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => apiClient.get<Application[]>('/applications/my').then((r) => r.data),
    enabled: !!user && tab === 'applied',
  });

  const { data: receivedApplications } = useQuery({
    queryKey: ['receivedApplications'],
    queryFn: () => apiClient.get<Application[]>('/applications/received').then((r) => r.data),
    enabled: !!user && tab === 'received',
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppStatus }) =>
      apiClient.patch(`/applications/${id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['receivedApplications'] }),
  });

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      '정말 탈퇴하시겠어요?\n\n' +
      '• 작성한 공고와 채팅 내역이 삭제됩니다\n' +
      '• 탈퇴 후 30일간 재가입이 제한됩니다\n' +
      '• 이 작업은 되돌릴 수 없습니다'
    );
    if (!confirmed) return;

    const reconfirmed = confirm('마지막으로 확인합니다. 탈퇴하시겠습니까?');
    if (!reconfirmed) return;

    try {
      await apiClient.delete('/users/me');
      logout();
      localStorage.removeItem('accessToken');
      document.cookie = 'accessToken=;max-age=0;path=/';
      alert('탈퇴가 완료되었습니다. 이용해주셔서 감사합니다.');
      router.replace('/');
    } catch (e: any) {
      alert(e.response?.data?.message || '오류가 발생했습니다');
    }
  };

  if (!user) return null;

  return (
    <>
    {selectedApplicantId && (
      <ApplicantProfileModal
        applicantId={selectedApplicantId}
        onClose={() => setSelectedApplicantId(null)}
      />
    )}
    <SubHeader title="마이페이지" />
    <div className="mx-auto max-w-2xl px-4 py-8">

      {/* 프로필 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-2xl font-bold flex-shrink-0 overflow-hidden">
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.profileImage} alt="프로필" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            (user.nickname ?? '?')[0]
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{user.nickname ?? '사용자'}</h1>
          <div className="flex flex-wrap items-center gap-1 text-sm">
            <Link href={`/profile/${user.id}`} className="text-indigo-600 hover:underline">
              프로필 보기
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/profile/edit" className="text-gray-500 hover:underline">
              프로필 편집
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/favorites" className="text-gray-500 hover:underline" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Heart size={12} strokeWidth={1.8} /> 찜한 공고
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/notifications/settings" className="text-gray-500 hover:underline" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Bell size={12} strokeWidth={1.8} /> 알림 설정
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/notifications/keywords" className="text-gray-500 hover:underline" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Key size={12} strokeWidth={1.8} /> 키워드
            </Link>
          </div>
        </div>
        <button
          onClick={() => { logout(); router.replace('/login'); }}
          className="flex-shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          로그아웃
        </button>
      </div>

      {/* 탭 */}
      <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
        {([
          { key: 'posts',    label: '내 공고' },
          { key: 'applied',  label: '내 지원' },
          { key: 'received', label: '받은 지원' },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 내 공고 */}
      {tab === 'posts' && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Link
              href="/jobs/write"
              className="rounded-lg bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
            >
              + 공고 작성
            </Link>
          </div>
          {myPosts?.items.length === 0 && (
            <Empty text="작성한 공고가 없습니다." />
          )}
          {myPosts?.items.map((post) => (
            <PostRow key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 내가 지원한 목록 */}
      {tab === 'applied' && (
        <div className="space-y-3">
          {myApplications?.length === 0 && <Empty text="지원한 공고가 없습니다." />}
          {myApplications?.map((app) => {
            const s = STATUS_LABEL[app.status];
            return (
              <div key={app.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link href={`/jobs/${app.postId}`} className="font-semibold text-gray-900 hover:text-indigo-700 truncate block">
                      {app.post?.title ?? '삭제된 공고'}
                    </Link>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {app.post ? CATEGORY_LABEL[app.post.category] : ''} · {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                    {app.message && (
                      <p className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 line-clamp-2">
                        {app.message}
                      </p>
                    )}
                  </div>
                  <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${s.color}`}>
                    {s.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 받은 지원 */}
      {tab === 'received' && (
        <div className="space-y-3">
          {receivedApplications?.length === 0 && <Empty text="받은 지원이 없습니다." />}
          {receivedApplications?.map((app) => {
            const s = STATUS_LABEL[app.status];
            return (
              <div key={app.id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-2 text-xs text-indigo-600 font-medium truncate" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ClipboardList size={12} strokeWidth={1.8} /> {app.post?.title ?? '공고'}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => app.applicant?.id && setSelectedApplicantId(app.applicant.id)}
                      className="font-medium text-gray-900 hover:text-indigo-700 transition-colors text-left"
                    >
                      {app.applicant?.nickname ?? '익명'} <span className="text-xs text-gray-400 font-normal">프로필 보기 →</span>
                    </button>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {new Date(app.createdAt).toLocaleDateString('ko-KR')}
                    </p>
                    {app.message && (
                      <p className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                        {app.message}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${s.color}`}>
                      {s.label}
                    </span>
                    {app.status === 'PENDING' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => statusMutation.mutate({ id: app.id, status: 'ACCEPTED' })}
                          disabled={statusMutation.isPending}
                          className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
                        >
                          합격
                        </button>
                        <button
                          onClick={() => statusMutation.mutate({ id: app.id, status: 'REJECTED' })}
                          disabled={statusMutation.isPending}
                          className="rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          불합격
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* 약관 링크 */}
      <div style={{
        marginTop: 24, paddingTop: 16,
        borderTop: '0.5px solid #F3F4F6',
        display: 'flex', justifyContent: 'center', gap: 16,
      }}>
        <Link href="/terms" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'underline' }}>
          이용약관
        </Link>
        <Link href="/privacy" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'underline' }}>
          개인정보처리방침
        </Link>
      </div>

      {/* 회원 탈퇴 */}
      <div style={{ marginTop: 32, padding: '0 0px' }}>
        <button
          onClick={handleDeleteAccount}
          style={{
            width: '100%', padding: '14px',
            background: 'white', color: '#EF4444',
            border: '1px solid #FCA5A5',
            borderRadius: 12, fontSize: 14,
            fontWeight: 600, cursor: 'pointer',
          }}>
          회원 탈퇴
        </button>
        <p style={{
          fontSize: 11, color: '#9CA3AF',
          textAlign: 'center', marginTop: 8,
          lineHeight: 1.5,
        }}>
          탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다
        </p>
      </div>
    </div>
    </>
  );
}

function PostRow({ post }: { post: Post }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const handleClose = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm('이 공고를 마감하시겠습니까?')) return;
    setBusy(true);
    try {
      await apiClient.patch(`/posts/${post.id}/close`);
      qc.invalidateQueries({ queryKey: ['myPosts'] });
    } finally {
      setBusy(false);
    }
  };

  const handleReopen = async (e: React.MouseEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await apiClient.patch(`/posts/${post.id}/reopen`);
      qc.invalidateQueries({ queryKey: ['myPosts'] });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Link href={`/jobs/${post.id}`}>
      <div className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-indigo-200 transition-colors ${post.status === 'CLOSED' ? 'opacity-70' : ''}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className={`font-semibold truncate ${post.status === 'CLOSED' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
              {post.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {CATEGORY_LABEL[post.category]} · {post.region ?? '지역 미정'} · 조회 {post.viewCount}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              post.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
              post.status === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {post.status === 'ACTIVE' ? '모집중' : post.status === 'CLOSED' ? '마감' : '숨김'}
            </span>
            {post.status === 'ACTIVE' && (
              <button
                onClick={handleClose}
                disabled={busy}
                className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 disabled:opacity-50"
              >
                마감
              </button>
            )}
            {post.status === 'CLOSED' && (
              <button
                onClick={handleReopen}
                disabled={busy}
                className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 hover:bg-green-200 disabled:opacity-50"
              >
                재등록
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <Inbox size={40} color="#9CA3AF" style={{ marginBottom: 8 }} />
      <p className="text-sm">{text}</p>
    </div>
  );
}
