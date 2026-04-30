'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { Post } from '@/types';

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

export default function MyPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('posts');

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const { data: myPosts } = useQuery({
    queryKey: ['myPosts'],
    queryFn: () =>
      apiClient
        .get<{ items: Post[]; total: number }>(`/posts?authorId=${user?.id}&limit=50`)
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

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* 프로필 헤더 */}
      <div className="mb-6 flex items-center gap-4">
        <div className="h-14 w-14 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-2xl font-bold flex-shrink-0 overflow-hidden">
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
            <Link href={`/profile/${user.id}`} className="text-violet-600 hover:underline">
              프로필 보기
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/profile/edit" className="text-gray-500 hover:underline">
              프로필 편집
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/favorites" className="text-gray-500 hover:underline">
              ⭐ 찜한 공고
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/notifications/settings" className="text-gray-500 hover:underline">
              🔔 알림 설정
            </Link>
            <span className="text-gray-300">·</span>
            <Link href="/notifications/keywords" className="text-gray-500 hover:underline">
              🔍 키워드
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
              className="rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800"
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
                    <Link href={`/jobs/${app.postId}`} className="font-semibold text-gray-900 hover:text-violet-700 truncate block">
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
                <div className="mb-2 text-xs text-violet-600 font-medium truncate">
                  📋 {app.post?.title ?? '공고'}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {app.applicant?.nickname ?? '익명'}
                    </p>
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
    </div>
  );
}

function PostRow({ post }: { post: Post }) {
  return (
    <Link href={`/jobs/${post.id}`}>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm hover:border-violet-200 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{post.title}</p>
            <p className="mt-0.5 text-xs text-gray-400">
              {CATEGORY_LABEL[post.category]} · {post.region ?? '지역 미정'} · 조회 {post.viewCount}
            </p>
          </div>
          <span className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
            post.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
            post.status === 'CLOSED' ? 'bg-gray-100 text-gray-500' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {post.status === 'ACTIVE' ? '모집중' : post.status === 'CLOSED' ? '마감' : '숨김'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <span className="mb-2 text-4xl">📭</span>
      <p className="text-sm">{text}</p>
    </div>
  );
}
