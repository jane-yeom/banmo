'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Share2, Heart, MessageCircle, Send, Pencil, Trash2, CheckCircle, RotateCcw, MapPin, Music, Eye, Calendar, ClipboardList, AlertCircle, Users } from 'lucide-react';
import Avatar from '@/components/common/Avatar';
import dynamic from 'next/dynamic';
const ImageGallery = dynamic(() => import('@/components/common/ImageGallery'), { ssr: false });
import ReportModal from '@/components/common/ReportModal';
import SubHeader from '@/components/layout/SubHeader';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { usePost } from '@/hooks/usePosts';
import { useCreateChatRoom } from '@/hooks/useChat';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/axios';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';
import PayBadge from '@/components/common/PayBadge';
const ResumeViewer = dynamic(() => import('@/components/common/ResumeViewer'), { ssr: false });
// TODO: 유료 기능 활성화시 주석 해제
// import PremiumModal from '@/components/payment/PremiumModal';

const CATEGORY_LABEL: Record<string, string> = {
  JOB_OFFER: '반주자 구인', JOB_SEEK: '반주자 구직',
  LESSON_OFFER: '레슨 구인', LESSON_SEEK: '레슨 구직',
  PERFORMANCE: '공연 도우미', AFTERSCHOOL: '방과후 교사',
  ACADEMY_OFFER: '학원선생님 구인', ACADEMY_SEEK: '학원선생님 구직',
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
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #1C1C1C, #000000)' }}
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
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-indigo-400 resize-none"
        />
        {applyMutation.isError && (
          <p className="mt-2 text-xs text-red-500">
            {(applyMutation.error as any)?.response?.data?.message ?? '지원에 실패했습니다.'}
          </p>
        )}
        <div style={{
          background: '#FEF6E4', borderRadius: 8,
          padding: '10px 12px', fontSize: 12,
          color: '#B7770D', marginTop: 10,
          lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <ClipboardList size={14} strokeWidth={1.8} color="#B7770D" style={{ flexShrink: 0, marginTop: 1 }} />
          지원 시 프로필의 모든 정보(비공개 포함)가 채용 담당자에게 공개됩니다
        </div>
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
            className="flex-1 rounded-xl bg-indigo-700 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-60"
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
  const [isClosing, setIsClosing] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'applicants'>('info');
  const [resumeUser, setResumeUser] = useState<any>(null);
  // TODO: 유료 기능 활성화시 주석 해제
  // const [showPremium, setShowPremium] = useState(false);

  // 지원자 목록 (공고 작성자만)
  const { data: applicants } = useQuery({
    queryKey: ['postApplicants', id],
    queryFn: () =>
      apiClient.get<{ id: string; applicant: { id: string; nickname: string | null; profileImage: string | null }; message: string | null; status: string; createdAt: string }[]>(
        `/applications/post/${id}`
      ).then((r) => r.data),
    enabled: !!user && !!post && user.id === post.author.id,
  });

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
    try {
      const room = await createRoom.mutateAsync({ receiverId: post.author.id, postId: post.id });
      if (!room?.id) throw new Error('채팅방 생성 실패');
      router.push(`/chat/${room.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? '채팅방을 열 수 없습니다. 다시 시도해주세요.';
      toast.error(msg);
    }
  };

  const handleDelete = () => {
    if (!confirm('이 공고를 삭제하시겠습니까?')) return;
    deleteMutation.mutate();
  };

  const TRADE_CATS = new Set(['TRADE_INSTRUMENT', 'TRADE_LESSON', 'TRADE_SPACE', 'TRADE_TICKET']);

  const handleComplete = async () => {
    if (!confirm('거래완료 처리하시겠습니까?\n거래 완료 시 신뢰점수 +5점이 추가됩니다.')) return;
    setIsClosing(true);
    try {
      await apiClient.patch(`/posts/${id}/complete`);
      toast.success('거래완료 처리되었습니다');
      qc.invalidateQueries({ queryKey: ['posts', id] });
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsClosing(false);
    }
  };

  const handleClose = async () => {
    if (!confirm('이 공고를 마감하시겠습니까?')) return;
    setIsClosing(true);
    try {
      await apiClient.patch(`/posts/${id}/close`);
      toast.success('공고가 마감되었습니다');
      qc.invalidateQueries({ queryKey: ['posts', id] });
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsClosing(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = post?.title ?? '';
    const text = `${(post as any)?.payText || '협의'} | ${post?.region || ''}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('링크가 복사되었습니다');
    } catch {
      toast.error('복사 실패');
    }
  };

  const handleReopen = async () => {
    setIsClosing(true);
    try {
      await apiClient.patch(`/posts/${id}/reopen`);
      toast.success('공고가 재등록되었습니다');
      qc.invalidateQueries({ queryKey: ['posts', id] });
    } catch {
      toast.error('오류가 발생했습니다');
    } finally {
      setIsClosing(false);
    }
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
        <Link href="/jobs" className="mt-4 text-indigo-600 hover:underline">목록으로</Link>
      </div>
    );

  const isOwner = user?.id === post.author.id;
  const canApply = APPLY_CATEGORIES.has(post.category);

  return (
    <>
      {showApply && (
        <ApplyModal postId={post.id} onClose={() => setShowApply(false)} />
      )}
      {showReport && (
        <ReportModal
          type="POST"
          targetId={post.id}
          targetName={post.title}
          onClose={() => setShowReport(false)}
        />
      )}
      {resumeUser && (
        <ResumeViewer
          user={resumeUser}
          onClose={() => setResumeUser(null)}
        />
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

      <SubHeader
        title="공고 상세"
        rightElement={
          <button onClick={handleShare} style={{
            background: 'none', border: 'none',
            cursor: 'pointer', padding: 4,
            display: 'flex', alignItems: 'center',
          }}>
            <Share2 size={22} color="#6B7280" strokeWidth={1.8} />
          </button>
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-8">

        {/* 거래완료 배지 */}
        {(post as any).isCompleted && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#EAF6EF', border: '1px solid #5AAB7A',
            borderRadius: 99, padding: '6px 14px', marginBottom: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#5AAB7A' }}/>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#5AAB7A' }}>거래완료</span>
          </div>
        )}

        {/* 카테고리 + 상태 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="rounded-full px-3 py-1 text-sm font-medium" style={{ background: '#F0EDE6', color: '#1C1C1C' }}>
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{post.title}</h1>
            {(post as any).isEdited && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                <span>수정됨</span>
                {(post as any).editedAt && (
                  <span>· {new Date((post as any).editedAt).toLocaleDateString('ko-KR')}</span>
                )}
              </div>
            )}
          </div>
          {user && !isOwner && (
            <button
              onClick={handleFavorite}
              disabled={favMutation.isPending}
              className="flex-shrink-0 transition-transform hover:scale-110 disabled:opacity-60"
              title={isFavorite ? '찜 취소' : '찜하기'}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <Heart
                size={22}
                strokeWidth={1.8}
                color={isFavorite ? '#E8789A' : '#9CA3AF'}
                fill={isFavorite ? '#E8789A' : 'none'}
              />
            </button>
          )}
        </div>

        {/* 페이 */}
        <div className="mb-6 rounded-2xl p-5" style={{ background: '#F0EDE6', border: '1px solid #E8E4DC' }}>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: '#1C1C1C' }}>급여 조건</p>
          {(post as any).payText ? (
            <p className="text-sm font-semibold text-gray-800">{(post as any).payText}</p>
          ) : (
            <PayBadge payType={post.payType} payMin={post.payMin} payMax={post.payMax ?? undefined} />
          )}
        </div>

        {/* 기본 정보 */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <InfoItem icon={MapPin} label="지역" value={post.region ?? '미정'} />
          <InfoItem icon={Music} label="악기" value={post.instruments?.join(', ') || '미정'} />
          <InfoItem icon={Eye} label="조회수" value={`${post.viewCount.toLocaleString()}회`} />
          <InfoItem icon={Calendar} label="등록일" value={new Date(post.createdAt).toLocaleDateString('ko-KR')} />
        </div>

        {/* 상세 내용 */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
          <p className="mb-3 text-sm font-semibold text-gray-500">상세 내용</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>
        </div>

        {/* 이미지 */}
        {post.imageUrls?.filter(Boolean).length > 0 && (
          <div className="mb-8">
            <ImageGallery images={post.imageUrls.filter(Boolean)} />
          </div>
        )}

        {/* 작성자 프로필 */}
        <div className="mb-8 flex items-center gap-4 rounded-xl border border-gray-100 bg-white p-4">
          <Avatar src={post.author.profileImage} nickname={post.author.nickname} size={52} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900">{post.author.nickname ?? '익명'}</p>
            <div className="mt-1 flex items-center gap-2">
              <NoteGradeBadge grade={post.author.noteGrade} />
              <span className="text-xs text-gray-400">신뢰점수 {post.author.trustScore.toFixed(1)}</span>
            </div>
          </div>
          <Link
            href={`/profile/${post.author.id}`}
            className="flex-shrink-0 text-sm hover:underline" style={{ color: '#1C1C1C' }}
          >
            프로필 보기
          </Link>
        </div>

        {/* 지원자 목록 탭 (작성자에게만 표시) */}
        {isOwner && (
          <div className="mb-6">
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button
                onClick={() => setDetailTab('info')}
                style={{
                  padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: detailTab === 'info' ? '#1C1C1C' : '#F3F4F6',
                  color: detailTab === 'info' ? 'white' : '#6B7280',
                }}
              >
                공고 정보
              </button>
              <button
                onClick={() => setDetailTab('applicants')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: detailTab === 'applicants' ? '#1C1C1C' : '#F3F4F6',
                  color: detailTab === 'applicants' ? 'white' : '#6B7280',
                }}
              >
                <Users size={14} strokeWidth={2} />
                지원자 목록 {applicants?.length !== undefined ? `(${applicants.length})` : ''}
              </button>
            </div>

            {detailTab === 'applicants' && (
              <div>
                {!applicants || applicants.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#9CA3AF' }}>
                    <Users size={40} strokeWidth={1.5} color="#9CA3AF" style={{ marginBottom: 8 }} />
                    <p style={{ fontSize: 14 }}>아직 지원자가 없습니다</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {applicants.map((app) => (
                      <div key={app.id} style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E7EB', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <Avatar src={app.applicant.profileImage} nickname={app.applicant.nickname} size={40} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 600, fontSize: 14, color: '#1A1A1A' }}>{app.applicant.nickname ?? '익명'}</p>
                            {app.message && (
                              <p style={{ fontSize: 12, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {app.message}
                              </p>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => setResumeUser(app.applicant)} style={{
                              padding: '6px 12px',
                              background: '#1C1C1C', color: 'white',
                              border: 'none', borderRadius: 8,
                              fontSize: 12, fontWeight: 600,
                              cursor: 'pointer',
                            }}>
                              이력서 보기
                            </button>
                            <Link
                              href={`/profile/${app.applicant.id}`}
                              style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: '1px solid #1C1C1C', color: '#1C1C1C', textDecoration: 'none' }}
                            >
                              프로필
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

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
            {/* 거래완료 버튼 (중고/양도 카테고리, ACTIVE 상태, 미완료 시) */}
            {TRADE_CATS.has(post.category) && post.status === 'ACTIVE' && !(post as any).isCompleted && (
              <button
                onClick={handleComplete}
                disabled={isClosing}
                className="w-full rounded-xl py-3 text-base font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #5AAB7A, #3d8a5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <CheckCircle size={16} strokeWidth={2} /> 거래완료
              </button>
            )}
            {/* 마감/재등록 */}
            {post.status === 'ACTIVE' ? (
              <button
                onClick={handleClose}
                disabled={isClosing}
                className="w-full rounded-xl border-2 border-gray-300 py-3 text-base font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-60"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <CheckCircle size={16} strokeWidth={2} color="#6B7280" /> 마감하기
              </button>
            ) : post.status === 'CLOSED' ? (
              <button
                onClick={handleReopen}
                disabled={isClosing}
                className="w-full rounded-xl py-3 text-base font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg, #5AAB7A, #3d8a5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <RotateCcw size={16} strokeWidth={2} /> 재등록하기
              </button>
            ) : null}
            <div className="flex gap-3">
              <Link
                href={`/jobs/${id}/edit`}
                className="flex-1 rounded-xl border-2 py-3.5 text-center text-base font-semibold transition-colors"
                style={{ borderColor: '#1C1C1C', color: '#1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Pencil size={15} strokeWidth={2} /> 수정하기
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex-1 rounded-xl border-2 border-red-300 py-3.5 text-base font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-60"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Trash2 size={15} strokeWidth={1.8} /> 삭제하기
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex gap-3">
              <button
                onClick={handleChat}
                disabled={createRoom.isPending || post.status === 'CLOSED'}
                className="flex-1 rounded-xl py-3.5 text-base font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: post.status === 'CLOSED' ? '#9CA3AF' : 'linear-gradient(135deg, #1C1C1C, #000000)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                {post.status === 'CLOSED' ? '마감된 공고' : <><MessageCircle size={18} strokeWidth={2} /> 채팅하기</>}
              </button>
              {canApply && post.status !== 'CLOSED' && (
                <button
                  onClick={() => {
                    if (!user) { router.push('/login'); return; }
                    setShowApply(true);
                  }}
                  className="flex-1 rounded-xl border-2 py-3.5 text-base font-semibold transition-colors"
                  style={{ borderColor: '#1C1C1C', color: '#1C1C1C', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Send size={16} strokeWidth={2} /> 지원하기
                </button>
              )}
            </div>
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

function InfoItem({ icon: Icon, label, value, color = '#1C1C1C' }: { icon: React.ElementType; label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="rounded-xl border border-gray-100 bg-white p-3">
      <div style={{
        width: 34, height: 34, background: '#F0EDE6',
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
