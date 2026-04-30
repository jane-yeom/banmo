'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { usePost } from '@/hooks/usePosts';
import { useCreateChatRoom } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/axios';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';

const CATEGORY_LABEL: Record<string, string> = {
  TRADE_INSTRUMENT: '중고 악기',
  TRADE_LESSON: '레슨 양도',
  TRADE_SPACE: '연습실 양도',
  TRADE_TICKET: '티켓 양도',
};

function PriceOfferModal({ postId, askPrice, onClose }: { postId: string; askPrice: number; onClose: () => void }) {
  const [price, setPrice] = useState(askPrice > 0 ? String(Math.round(askPrice / 10000)) : '');
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const offerMutation = useMutation({
    mutationFn: () =>
      apiClient.post('/applications', {
        postId,
        message: `[가격 제안] ${price}만원\n${message}`,
      }),
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-3 text-5xl">🎉</div>
          <h3 className="mb-2 text-lg font-bold">가격 제안 완료!</h3>
          <p className="mb-6 text-sm text-gray-500">판매자와 채팅방이 생성되었습니다.</p>
          <button onClick={onClose} className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white hover:bg-amber-600">
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold">가격 제안하기</h3>
        <div className="mb-3">
          <label className="mb-1 block text-xs font-medium text-gray-600">제안 가격 (만원)</label>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2.5">
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min={0}
              className="flex-1 text-sm focus:outline-none"
              placeholder="0"
            />
            <span className="text-sm text-gray-400">만원</span>
          </div>
        </div>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium text-gray-600">메시지 (선택)</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="판매자에게 전할 말을 적어주세요."
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400 resize-none"
          />
        </div>
        {offerMutation.isError && (
          <p className="mb-2 text-xs text-red-500">
            {(offerMutation.error as any)?.response?.data?.message ?? '오류가 발생했습니다.'}
          </p>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={() => offerMutation.mutate()}
            disabled={offerMutation.isPending || !price}
            className="flex-1 rounded-xl bg-amber-500 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-60"
          >
            {offerMutation.isPending ? '전송 중...' : '제안하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: post, isLoading } = usePost(id);
  const createRoom = useCreateChatRoom();
  const [imgIdx, setImgIdx] = useState(0);
  const [showOffer, setShowOffer] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/posts/${id}`),
    onSuccess: () => router.push('/trade'),
  });

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
        <Link href="/trade" className="mt-4 text-amber-600 hover:underline">목록으로</Link>
      </div>
    );
  }

  const isOwner = user?.id === post.author.id;
  const images = post.imageUrls?.filter(Boolean) ?? [];

  return (
    <>
      {showOffer && (
        <PriceOfferModal
          postId={post.id}
          askPrice={post.payMin}
          onClose={() => setShowOffer(false)}
        />
      )}

      <div className="mx-auto max-w-3xl px-4 py-6">
        {/* 이미지 슬라이더 */}
        {images.length > 0 ? (
          <div className="mb-5">
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100 shadow-sm">
              <Image src={images[imgIdx]} alt={`이미지 ${imgIdx + 1}`} fill className="object-contain" />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
                  >
                    ‹
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
                  >
                    ›
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setImgIdx(i)}
                        className={`h-2 w-2 rounded-full transition-colors ${i === imgIdx ? 'bg-white' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {images.map((url, i) => (
                  <button key={i} onClick={() => setImgIdx(i)} className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === imgIdx ? 'border-amber-500' : 'border-transparent'}`}>
                    <div className="relative h-14 w-14">
                      <Image src={url} alt={`썸네일 ${i + 1}`} fill className="object-cover" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-5 flex aspect-square w-full items-center justify-center rounded-2xl bg-gray-100 text-6xl">
            📦
          </div>
        )}

        {/* 카테고리 */}
        <div className="mb-2 flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
            {CATEGORY_LABEL[post.category] ?? post.category}
          </span>
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
            post.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {post.status === 'ACTIVE' ? '판매중' : post.status === 'CLOSED' ? '거래완료' : '숨김'}
          </span>
        </div>

        <h1 className="mb-2 text-xl font-bold text-gray-900">{post.title}</h1>

        {/* 가격 */}
        <div className="mb-5 rounded-2xl bg-amber-50 border border-amber-100 p-4">
          <p className="text-2xl font-bold text-amber-700">
            {post.payType === 'NEGOTIABLE' || post.payMin === 0
              ? '가격 협의'
              : `${(post.payMin / 10000).toFixed(0)}만원`}
          </p>
          {post.payMax && post.payMax !== post.payMin && (
            <p className="mt-0.5 text-sm text-amber-500">~{(post.payMax / 10000).toFixed(0)}만원</p>
          )}
        </div>

        {/* 기본 정보 */}
        <div className="mb-5 grid grid-cols-2 gap-3">
          <InfoItem icon="📍" label="지역" value={post.region ?? '미정'} />
          <InfoItem icon="📅" label="등록일" value={new Date(post.createdAt).toLocaleDateString('ko-KR')} />
          <InfoItem icon="👁" label="조회수" value={`${post.viewCount.toLocaleString()}회`} />
          {post.instruments?.length > 0 && (
            <InfoItem icon="🎵" label="악기" value={post.instruments.join(', ')} />
          )}
        </div>

        {/* 상세 내용 */}
        <div className="mb-6 rounded-xl border border-gray-100 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-500">상품 설명</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>

        {/* 판매자 프로필 */}
        <div className="mb-6 flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
          {post.author.profileImage ? (
            <Image src={post.author.profileImage} alt="프로필" width={48} height={48} className="rounded-full object-cover flex-shrink-0" />
          ) : (
            <div
              className="flex-shrink-0 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 text-xl font-bold"
              style={{ width: 48, height: 48 }}
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
          <Link href={`/profile/${post.author.id}`} className="text-sm text-amber-600 hover:underline flex-shrink-0">
            프로필 보기
          </Link>
        </div>

        {/* 액션 */}
        {isOwner ? (
          <div className="flex gap-3">
            <Link
              href={`/jobs/${id}/edit`}
              className="flex-1 rounded-xl border-2 border-amber-500 py-3.5 text-center text-base font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
            >
              ✏️ 수정하기
            </Link>
            <button
              onClick={() => confirm('삭제하시겠습니까?') && deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="flex-1 rounded-xl border-2 border-red-300 py-3.5 text-base font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
            >
              🗑 삭제하기
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleChat}
              disabled={createRoom.isPending}
              className="flex-1 rounded-xl bg-amber-500 py-3.5 text-base font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-60"
            >
              💬 채팅하기
            </button>
            <button
              onClick={() => {
                if (!user) { router.push('/login'); return; }
                setShowOffer(true);
              }}
              className="flex-1 rounded-xl border-2 border-amber-500 py-3.5 text-base font-semibold text-amber-600 hover:bg-amber-50 transition-colors"
            >
              💰 가격 제안
            </button>
          </div>
        )}
      </div>
    </>
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
