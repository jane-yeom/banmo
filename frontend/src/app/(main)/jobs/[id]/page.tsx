'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usePost } from '@/hooks/usePosts';
import { useCreateChatRoom } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/axios';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';
import PayBadge from '@/components/common/PayBadge';
// TODO: 유료 기능 활성화시 주석 해제
// import PremiumModal from '@/components/payment/PremiumModal';

const CATEGORY_LABEL: Record<string, string> = {
  JOB_OFFER: '반주자 구인', JOB_SEEK: '반주자 구직',
  LESSON_OFFER: '레슨 구인', LESSON_SEEK: '레슨 구직',
  PERFORMANCE: '공연 도우미', AFTERSCHOOL: '방과후 교사',
  PROMO_CONCERT: '연주회 홍보', PROMO_SPACE: '연습실 대여',
  TRADE_LESSON: '레슨 양도', TRADE_SPACE: '연습실 양도',
  TRADE_TICKET: '티켓 양도', TRADE_INSTRUMENT: '중고 악기',
};

// 지원 가능한 카테고리
const APPLY_CATEGORIES = new Set(['JOB_OFFER', 'LESSON_OFFER', 'PERFORMANCE', 'AFTERSCHOOL']);

function ApplyModal({
  postId,
  onClose,
}: {
  postId: string;
  onClose: () => void;
}) {
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const applyMutation = useMutation({
    mutationFn: () => apiClient.post('/applications', { postId, message }),
    onSuccess: () => {
      toast.success('지원이 완료되었습니다');
      setDone(true);
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  });

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-3 text-5xl">🎉</div>
          <h3 className="mb-2 text-lg font-bold text-gray-900">지원 완료!</h3>
          <p className="mb-6 text-sm text-gray-500">공고 작성자와 채팅방이 생성되었습니다.</p>
          <button
            onClick={onClose}
            className="w-full rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white hover:bg-violet-800"
          >
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-bold text-gray-900">지원하기</h3>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="지원 메시지를 입력하세요. (선택사항)"
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-violet-400 resize-none"
        />
        {applyMutation.isError && (
          <p className="mt-2 text-xs text-red-500">
            {(applyMutation.error as any)?.response?.data?.message ?? '지원에 실패했습니다.'}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={() => applyMutation.mutate()}
            disabled={applyMutation.isPending}
            className="flex-1 rounded-xl bg-violet-700 py-2.5 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {applyMutation.isPending ? '지원 중...' : '지원 완료'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data: post, isLoading } = usePost(id);
  const createRoom = useCreateChatRoom();
  const qc = useQueryClient();
  const [showApply, setShowApply] = useState(false);
  // TODO: 유료 기능 활성화시 주석 해제
  // const [showPremium, setShowPremium] = useState(false);

  // 찜 여부 조회
  const { data: favData } = useQuery({
    queryKey: ['favoriteCheck', id],
    queryFn: () =>
      apiClient.get<{ isFavorite: boolean }>(`/favorites/${id}/check`).then((r) => r.data),
    enabled: !!user && !!id,
  });
  const isFavorite = favData?.isFavorite ?? false;

  const favMutation = useMutation({
    mutationFn: () =>
      isFavorite
        ? apiClient.delete(`/favorites/${id}`)
        : apiClient.post('/favorites', { postId: id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favoriteCheck', id] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
      toast.success(isFavorite ? '찜이 취소되었습니다' : '찜 목록에 추가되었습니다');
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  });

  const handleFavorite = () => {
    if (!user) { router.push('/login'); return; }
    favMutation.mutate();
  };

  const deleteMutation = useMutation({
    mutationFn: () => apiClient.delete(`/posts/${id}`),
    onSuccess: () => {
      toast.success('공고가 삭제되었습니다');
      router.push('/jobs');
    },
    onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
  });

  const handleChat = async () => {
    if (!user) { router.push('/login'); return; }
    if (!post) return;
    const room = await createRoom.mutateAsync({ receiverId: post.author.id, postId: post.id });
    router.push(`/chat/${room.id}`);
  };

  const handleDelete = () => {
    if (!confirm('이 공고를 삭제하시겠습니까?')) return;
    deleteMutation.mutate();
  };

  if (isLoading)
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />
        ))}
      </div>
    );

  if (!post)
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <span className="text-5xl mb-3">😢</span>
        <p>공고를 찾을 수 없습니다.</p>
        <Link href="/jobs" className="mt-4 text-violet-600 hover:underline">목록으로</Link>
      </div>
    );

  const isOwner = user?.id === post.author.id;
  const canApply = APPLY_CATEGORIES.has(post.category);

  return (
    <>
      {showApply && (
        <ApplyModal postId={post.id} onClose={() => setShowApply(false)} />
      )}
      {/* TODO: 유료 기능 활성화시 주석 해제
      {showPremium && (
        <PremiumModal
          postId={post.id}
          postTitle={post.title}
          onClose={() => setShowPremium(false)}
          onSuccess={() => { setShowPremium(false); window.location.reload(); }}
        />
      )}
      */}

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* 카테고리 + 상태 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-full bg-violet-100 px-3 py-1 text-sm font-medium text-violet-700">
            {CATEGORY_LABEL[post.category] ?? post.category}
          </span>
          {/* TODO: 유료 기능 활성화시 주석 해제 (프리미엄 배지)
          {post.isPremium && (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-sm font-bold text-white">
              👑 프리미엄
            </span>
          )}
          */}
          <span className={`ml-auto rounded-full px-3 py-1 text-xs font-medium ${
            post.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          }`}>
            {post.status === 'ACTIVE' ? '모집중' : post.status === 'CLOSED' ? '마감' : '숨김'}
          </span>
        </div>

        {/* 제목 + 찜 버튼 */}
        <div className="flex items-start gap-3 mb-4">
          <h1 className="flex-1 text-2xl font-bold text-gray-900">{post.title}</h1>
          {user && !isOwner && (
            <button
              onClick={handleFavorite}
              disabled={favMutation.isPending}
              className="flex-shrink-0 text-2xl transition-transform hover:scale-110 disabled:opacity-60"
              title={isFavorite ? '찜 취소' : '찜하기'}
            >
              {isFavorite ? '❤️' : '🤍'}
            </button>
          )}
        </div>

        {/* 페이 */}
        <div className="mb-6 rounded-2xl bg-violet-50 p-5 border border-violet-100">
          <p className="mb-2 text-xs font-semibold text-violet-500 uppercase tracking-wide">급여 조건</p>
          <PayBadge payType={post.payType} payMin={post.payMin} payMax={post.payMax ?? undefined} />
        </div>

        {/* 기본 정보 */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <InfoItem icon="📍" label="지역" value={post.region ?? '미정'} />
          <InfoItem icon="🎵" label="악기" value={post.instruments?.join(', ') || '미정'} />
          <InfoItem icon="👁" label="조회수" value={`${post.viewCount.toLocaleString()}회`} />
          <InfoItem icon="📅" label="등록일" value={new Date(post.createdAt).toLocaleDateString('ko-KR')} />
        </div>

        {/* 상세 내용 */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-500">상세 내용</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>

        {/* 이미지 */}
        {post.imageUrls?.filter(Boolean).length > 0 && (
          <div className="mb-8 grid grid-cols-2 gap-2">
            {post.imageUrls.filter(Boolean).map((url, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <Image src={url} alt={`첨부 이미지 ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* 작성자 프로필 */}
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
              className="flex-shrink-0 rounded-full bg-violet-200 flex items-center justify-center text-violet-700 text-xl font-bold"
              style={{ width: 52, height: 52 }}
            >
              {(post.author.nickname ?? '?')[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{post.author.nickname ?? '익명'}</p>
            <div className="mt-1 flex items-center gap-2">
              <NoteGradeBadge grade={post.author.noteGrade} />
              <span className="text-xs text-gray-400">신뢰점수 {post.author.trustScore.toFixed(1)}</span>
            </div>
          </div>
          <Link
            href={`/profile/${post.author.id}`}
            className="flex-shrink-0 text-sm text-violet-600 hover:underline"
          >
            프로필 보기
          </Link>
        </div>

        {/* 액션 버튼 */}
        {isOwner ? (
          <div className="space-y-3">
            {/* TODO: 유료 기능 활성화시 주석 해제 (상위노출 버튼 + 프리미엄 상태 표시)
            {!post.isPremium && (
              <button
                onClick={() => setShowPremium(true)}
                className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 py-3.5 text-base font-bold text-white hover:from-amber-500 hover:to-amber-600 transition-colors shadow-sm"
              >
                👑 상위노출 하기
              </button>
            )}
            {post.isPremium && (
              <div className="flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-200 py-3 text-sm font-medium text-amber-700">
                <span>👑</span>
                <span>
                  프리미엄 노출 중
                  {post.premiumExpiresAt &&
                    ` · ${new Date(post.premiumExpiresAt).toLocaleDateString('ko-KR')} 만료`}
                </span>
              </div>
            )}
            */}
            <div className="flex gap-3">
              <Link
                href={`/jobs/${id}/edit`}
                className="flex-1 rounded-xl border-2 border-violet-700 py-3.5 text-center text-base font-semibold text-violet-700 hover:bg-violet-50 transition-colors"
              >
                ✏️ 수정하기
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl border-2 border-red-300 py-3.5 text-base font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                🗑 삭제하기
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleChat}
              disabled={createRoom.isPending}
              className="flex-1 rounded-xl bg-violet-700 py-3.5 text-base font-semibold text-white hover:bg-violet-800 transition-colors disabled:opacity-60"
            >
              💬 채팅하기
            </button>
            {canApply && (
              <button
                onClick={() => {
                  if (!user) { router.push('/login'); return; }
                  setShowApply(true);
                }}
                className="flex-1 rounded-xl border-2 border-violet-700 py-3.5 text-base font-semibold text-violet-700 hover:bg-violet-50 transition-colors"
              >
                ✋ 지원하기
              </button>
            )}
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
