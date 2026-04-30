'use client';

import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { usePost } from '@/hooks/usePosts';
import { useCreateChatRoom } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';

const CATEGORY_LABEL: Record<string, string> = {
  PROMO_CONCERT: '연주회·공연 홍보',
  PROMO_SPACE: '연습실·공연장 대여',
};

export default function PromoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: post, isLoading } = usePost(id);
  const createRoom = useCreateChatRoom();

  const handleChat = async () => {
    if (!user) { router.push('/login'); return; }
    if (!post) return;
    const room = await createRoom.mutateAsync({ receiverId: post.author.id, postId: post.id });
    router.push(`/chat/${room.id}`);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <span className="text-5xl mb-3">😢</span>
        <p>게시글을 찾을 수 없습니다.</p>
        <Link href="/promo" className="mt-4 text-pink-600 hover:underline">목록으로</Link>
      </div>
    );
  }

  const isOwner = user?.id === post.author.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* 카테고리 배지 */}
      <div className="mb-3 flex items-center gap-2 flex-wrap">
        <span className="rounded-full bg-pink-100 px-3 py-1 text-sm font-medium text-pink-700">
          {CATEGORY_LABEL[post.category] ?? post.category}
        </span>
        {post.isPremium && (
          <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-white">
            👑 프리미엄
          </span>
        )}
        <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
          post.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>
          {post.status === 'ACTIVE' ? '모집중' : post.status === 'CLOSED' ? '마감' : '숨김'}
        </span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-4">{post.title}</h1>

      {/* 포스터 이미지 */}
      {post.imageUrls?.filter(Boolean).length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {post.imageUrls.filter(Boolean).map((url, i) => (
            <div key={i} className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 shadow-sm">
              <Image src={url} alt={`이미지 ${i + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* 기본 정보 */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <InfoItem icon="📍" label="지역" value={post.region ?? '미정'} />
        <InfoItem icon="🎵" label="악기" value={post.instruments?.join(', ') || '미정'} />
        {post.payMin > 0 && (
          <InfoItem
            icon="💰"
            label="가격"
            value={post.payType === 'NEGOTIABLE' ? '협의' : `${(post.payMin / 10000).toFixed(0)}만원~`}
          />
        )}
        <InfoItem icon="📅" label="등록일" value={new Date(post.createdAt).toLocaleDateString('ko-KR')} />
        <InfoItem icon="👁" label="조회수" value={`${post.viewCount.toLocaleString()}회`} />
      </div>

      {/* 상세 내용 */}
      <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
        <p className="mb-3 text-sm font-semibold text-gray-500">상세 내용</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* 작성자 */}
      <div className="mb-8 flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
        {post.author.profileImage ? (
          <Image
            src={post.author.profileImage}
            alt="프로필"
            width={52}
            height={52}
            className="rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="flex-shrink-0 rounded-full bg-pink-200 flex items-center justify-center text-pink-700 text-xl font-bold"
            style={{ width: 52, height: 52 }}
          >
            {(post.author.nickname ?? '?')[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900">{post.author.nickname ?? '익명'}</p>
          <div className="mt-1 flex items-center gap-2">
            <NoteGradeBadge grade={post.author.noteGrade} />
            <span className="text-xs text-gray-400">신뢰점수 {post.author.trustScore?.toFixed(1)}</span>
          </div>
        </div>
        <Link href={`/profile/${post.author.id}`} className="flex-shrink-0 text-sm text-pink-600 hover:underline">
          프로필 보기
        </Link>
      </div>

      {/* 액션 */}
      {isOwner ? (
        <div className="flex gap-3">
          <Link
            href={`/jobs/${id}/edit`}
            className="flex-1 rounded-xl border-2 border-pink-600 py-3.5 text-center text-base font-semibold text-pink-600 hover:bg-pink-50 transition-colors"
          >
            ✏️ 수정하기
          </Link>
        </div>
      ) : (
        <button
          onClick={handleChat}
          disabled={createRoom.isPending}
          className="w-full rounded-xl bg-pink-600 py-3.5 text-base font-semibold text-white hover:bg-pink-700 transition-colors disabled:opacity-60"
        >
          💬 채팅하기
        </button>
      )}
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <p className="text-xs text-gray-400 mb-0.5">{icon} {label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}
