'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import PostCard from '@/components/common/PostCard';
import { Post } from '@/types';

interface Favorite {
  id: string;
  postId: string;
  post: Post;
  createdAt: string;
}

export default function FavoritesPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const qc = useQueryClient();

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user, router]);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiClient.get<Favorite[]>('/favorites').then((r) => r.data),
    enabled: !!user,
  });

  const removeMutation = useMutation({
    mutationFn: (postId: string) => apiClient.delete(`/favorites/${postId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
      toast.success('찜이 취소되었습니다');
    },
  });

  if (!user) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-600"
        >
          ←
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">찜한 공고</h1>
          <p className="mt-0.5 text-sm text-gray-400">{favorites.length}개</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-36 rounded-xl bg-gray-200 animate-pulse" />
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <span className="text-5xl mb-3">🤍</span>
          <p className="text-base font-medium">찜한 공고가 없습니다</p>
          <p className="text-sm text-gray-300 mt-1">공고 상세 페이지에서 하트를 눌러 찜하세요</p>
          <Link
            href="/jobs"
            className="mt-4 rounded-lg bg-violet-700 px-4 py-2 text-sm font-medium text-white hover:bg-violet-800 transition-colors"
          >
            공고 보러가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {favorites.map((fav) => (
            <div key={fav.id} className="relative group">
              <Link href={`/jobs/${fav.post.id}`}>
                <PostCard
                  title={fav.post.title}
                  category={fav.post.category}
                  region={fav.post.region ?? ''}
                  pay={
                    fav.post.payType === 'NEGOTIABLE'
                      ? '협의'
                      : `${(fav.post.payMin / 10000).toFixed(0)}만원~`
                  }
                  noteGrade={fav.post.author?.noteGrade}
                  isPremium={fav.post.isPremium}
                />
              </Link>
              {/* 찜 취소 버튼 */}
              <button
                onClick={() => removeMutation.mutate(fav.post.id)}
                disabled={removeMutation.isPending}
                className="absolute top-2 right-2 h-8 w-8 flex items-center justify-center rounded-full bg-white/90 text-red-400 shadow-sm hover:bg-red-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                title="찜 취소"
              >
                ❤️
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
