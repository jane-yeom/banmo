'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import SubHeader from '@/components/layout/SubHeader';
import { usePost } from '@/hooks/usePosts';
import { useCreateChatRoom } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';
import { MapPin, Music, Coins, Calendar, Eye, MessageCircle, Pencil, X, AlertCircle } from 'lucide-react';
import ReportModal from '@/components/common/ReportModal';

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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

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
  const images = post.imageUrls?.filter(Boolean) ?? [];
  const mainImage = selectedImage ?? images[0] ?? null;
  const eventDateAt = (post as any).eventDateAt ? new Date((post as any).eventDateAt) : null;
  const isEventPast = eventDateAt ? eventDateAt < new Date() : false;

  return (
    <>
      {/* 이미지 전체화면 모달 */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.92)',
            zIndex: 200, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedImage}
            alt="이미지 전체보기"
            style={{
              maxWidth: '100%', maxHeight: '90vh',
              borderRadius: 8, objectFit: 'contain',
            }}
          />
          <button
            onClick={() => setSelectedImage(null)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: '50%',
              width: 40, height: 40, cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={22} color="white" strokeWidth={2} />
          </button>
        </div>
      )}

      <SubHeader title="공연/연습실" />
      <div className="mx-auto max-w-3xl px-4 py-6">

        {/* 이미지 갤러리 */}
        {images.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            {/* 대표 이미지 */}
            <div
              onClick={() => setSelectedImage(mainImage)}
              style={{
                width: '100%', aspectRatio: '16/9',
                borderRadius: 14, overflow: 'hidden',
                marginBottom: 8, background: '#F4F3F9',
                cursor: 'pointer', position: 'relative',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mainImage!}
                alt="대표 이미지"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* 추가 이미지 썸네일 */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                {images.map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={url}
                    alt={`이미지${i + 1}`}
                    onClick={() => setSelectedImage(url)}
                    style={{
                      width: 64, height: 64,
                      borderRadius: 8, objectFit: 'cover',
                      flexShrink: 0, cursor: 'pointer',
                      border: (selectedImage ?? images[0]) === url
                        ? '2px solid #7B82BE'
                        : '1px solid #DDD9EF',
                      transition: 'border 0.15s',
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* 공연 일시 배지 (PROMO_CONCERT) */}
        {post.category === 'PROMO_CONCERT' && eventDateAt && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: isEventPast ? '#F4F3F9' : '#ECEAF8',
            border: `1px solid ${isEventPast ? '#DDD9EF' : '#7B82BE'}`,
            borderRadius: 99, padding: '6px 14px', marginBottom: 12,
          }}>
            <Calendar size={13} strokeWidth={1.8}
              color={isEventPast ? '#9CA3AF' : '#7B82BE'} />
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: isEventPast ? '#9CA3AF' : '#5A63A8',
            }}>
              {isEventPast ? '공연 종료' : '공연 예정'}
            </span>
          </div>
        )}

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

        {/* 기본 정보 */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <InfoItem icon={MapPin} label="지역" value={post.region ?? '미정'} />
          <InfoItem icon={Music} label="악기" value={post.instruments?.join(', ') || '미정'} />
          {(post as any).payText && (
            <InfoItem icon={Coins} label="가격" value={(post as any).payText} />
          )}
          {!((post as any).payText) && post.payMin > 0 && (
            <InfoItem
              icon={Coins}
              label="가격"
              value={post.payType === 'NEGOTIABLE' ? '협의' : `${(post.payMin / 10000).toFixed(0)}만원~`}
            />
          )}
          <InfoItem icon={Calendar} label="등록일" value={new Date(post.createdAt).toLocaleDateString('ko-KR')} />
          <InfoItem icon={Eye} label="조회수" value={`${post.viewCount.toLocaleString()}회`} />
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

        {/* 신고 모달 */}
        {showReport && post && (
          <ReportModal
            type="POST"
            targetId={post.id}
            targetName={post.title}
            onClose={() => setShowReport(false)}
          />
        )}

        {/* 액션 */}
        {isOwner ? (
          <div className="flex gap-3">
            <Link
              href={`/jobs/${id}/edit`}
              className="flex-1 rounded-xl border-2 border-pink-600 py-3.5 text-center text-base font-semibold text-pink-600 hover:bg-pink-50 transition-colors"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <Pencil size={15} strokeWidth={2} /> 수정하기
            </Link>
          </div>
        ) : (
          <div>
            <button
              onClick={handleChat}
              disabled={createRoom.isPending}
              className="w-full rounded-xl bg-pink-600 py-3.5 text-base font-semibold text-white hover:bg-pink-700 transition-colors disabled:opacity-60"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <MessageCircle size={18} strokeWidth={2} /> 채팅하기
            </button>
            {user && (
              <button
                onClick={() => setShowReport(true)}
                style={{
                  width: '100%', marginTop: 10,
                  padding: '10px', background: 'none',
                  border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 4,
                  fontSize: 12, color: '#9CA3AF',
                }}
              >
                <AlertCircle size={13} strokeWidth={1.8} /> 이 공고 신고하기
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function InfoItem({ icon: Icon, label, value, color = '#7B82BE' }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="rounded-xl border border-gray-100 bg-white p-3">
      <div style={{
        width: 34, height: 34, background: '#FEE2E2',
        borderRadius: 10, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={17} strokeWidth={1.8} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#1A1A1A' }}>{value}</div>
      </div>
    </div>
  );
}
