'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { User, Post } from '@/types';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';
import PostCard from '@/components/common/PostCard';

function useUserProfile(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => apiClient.get<User>(`/users/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

function useUserPosts(userId: string) {
  return useQuery({
    queryKey: ['posts', 'user', userId],
    queryFn: () =>
      apiClient
        .get<{ items: Post[]; total: number }>(`/posts?authorId=${userId}`)
        .then((r) => r.data),
    enabled: !!userId,
  });
}

function VideoModal({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300"
        >
          닫기 ✕
        </button>
        <video
          src={url}
          controls
          autoPlay
          className="w-full rounded-xl max-h-[80vh] bg-black"
        />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuthStore();
  const [modalUrl, setModalUrl] = useState<string | null>(null);

  const { data: user, isLoading } = useUserProfile(id);
  const { data: postsData } = useUserPosts(id);

  const isMyProfile = me?.id === id;
  const videos = user?.videoUrls?.filter(Boolean) ?? [];
  const instruments = user?.instruments?.filter(Boolean) ?? [];

  if (isLoading)
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 space-y-4">
        <div className="h-32 rounded-2xl bg-gray-200 animate-pulse" />
        <div className="h-48 rounded-2xl bg-gray-200 animate-pulse" />
      </div>
    );

  if (!user)
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <span className="text-5xl mb-3">😢</span>
        <p>사용자를 찾을 수 없습니다.</p>
      </div>
    );

  return (
    <>
      {modalUrl && (
        <VideoModal url={modalUrl} onClose={() => setModalUrl(null)} />
      )}

      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">
        {/* 프로필 카드 */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-violet-600 to-violet-800" />
          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="flex items-end gap-4">
                {user.profileImage ? (
                  <Image
                    src={user.profileImage}
                    alt={user.nickname ?? '프로필'}
                    width={80}
                    height={80}
                    className="rounded-full border-4 border-white object-cover shadow"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full border-4 border-white bg-violet-200 flex items-center justify-center text-violet-700 text-3xl font-bold shadow">
                    {(user.nickname ?? '?')[0]}
                  </div>
                )}
                <div className="mb-1">
                  <h1 className="text-xl font-bold text-gray-900">
                    {user.nickname ?? '익명'}
                  </h1>
                  <NoteGradeBadge grade={user.noteGrade} size="md" />
                </div>
              </div>

              {isMyProfile && (
                <Link
                  href="/profile/edit"
                  className="mt-12 rounded-lg border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  프로필 편집
                </Link>
              )}
            </div>

            {/* 기본 정보 */}
            <div className="flex flex-wrap gap-3 mb-4 text-sm text-gray-600">
              {user.region && (
                <span className="flex items-center gap-1">📍 {user.region}</span>
              )}
              <span className="flex items-center gap-1">
                ⭐ 신뢰점수 {user.trustScore.toFixed(1)}
              </span>
            </div>

            {/* 악기 */}
            {instruments.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {instruments.map((inst) => (
                  <span
                    key={inst}
                    className="rounded-full bg-violet-50 border border-violet-200 px-3 py-0.5 text-xs text-violet-700 font-medium"
                  >
                    🎵 {inst}
                  </span>
                ))}
              </div>
            )}

            {/* 자기소개 */}
            {user.bio && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* 연주 영상 */}
        {videos.length > 0 && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-800 mb-4">
              🎬 연주 영상
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {videos.map((url, i) => (
                <div
                  key={i}
                  className="group relative rounded-xl overflow-hidden bg-black aspect-video cursor-pointer"
                  onClick={() => setModalUrl(url)}
                >
                  <video
                    src={url}
                    className="w-full h-full object-contain"
                    preload="metadata"
                  />
                  {/* 재생 오버레이 */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <svg
                        className="h-5 w-5 text-violet-700 ml-0.5"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 작성한 공고 */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4">
            📋 작성한 공고 {postsData ? `(${postsData.total})` : ''}
          </h2>
          {postsData?.items.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              작성한 공고가 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {postsData?.items.map((post) => (
                <Link key={post.id} href={`/jobs/${post.id}`}>
                  <PostCard
                    title={post.title}
                    category={post.category}
                    region={post.region ?? ''}
                    pay={
                      post.payType === 'NEGOTIABLE'
                        ? '협의'
                        : `${(post.payMin / 10000).toFixed(0)}만원~`
                    }
                    isPremium={post.isPremium}
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
