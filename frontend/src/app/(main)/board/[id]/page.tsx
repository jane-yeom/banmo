'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useBoardPost, useDeleteBoardPost, useAddComment, useDeleteComment } from '@/hooks/useBoard';
import { useAuthStore } from '@/store/auth.store';
import apiClient from '@/lib/axios';

const TYPE_LABEL: Record<string, string> = {
  FREE:      '자유게시판',
  ANONYMOUS: '익명게시판',
  NOTICE:    '공지사항',
};

const TYPE_COLOR: Record<string, string> = {
  FREE:      'bg-teal-100 text-teal-700',
  ANONYMOUS: 'bg-gray-100 text-gray-600',
  NOTICE:    'bg-red-100 text-red-600',
};

function ReportModal({ targetId, targetType, onClose }: { targetId: string; targetType: string; onClose: () => void }) {
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);

  const reportMutation = useMutation({
    mutationFn: () => apiClient.post('/reports', { targetId, targetType, reason }),
    onSuccess: () => setDone(true),
  });

  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-xl">
          <div className="mb-3 text-5xl">✅</div>
          <h3 className="mb-2 text-lg font-bold">신고 완료</h3>
          <p className="mb-6 text-sm text-gray-500">검토 후 조치하겠습니다.</p>
          <button onClick={onClose} className="w-full rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white hover:bg-teal-700">
            확인
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-4 text-lg font-bold text-gray-900">신고하기</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="신고 사유를 입력하세요."
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400 resize-none mb-4"
        />
        {reportMutation.isError && (
          <p className="mb-2 text-xs text-red-500">신고에 실패했습니다. 잠시 후 다시 시도해주세요.</p>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm text-gray-600 hover:bg-gray-50">
            취소
          </button>
          <button
            onClick={() => reportMutation.mutate()}
            disabled={!reason.trim() || reportMutation.isPending}
            className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
          >
            {reportMutation.isPending ? '신고 중...' : '신고하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const { data, isLoading } = useBoardPost(id);
  const deleteMutation = useDeleteBoardPost();
  const addComment = useAddComment();
  const deleteComment = useDeleteComment();
  const [comment, setComment] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [reportTargetId, setReportTargetId] = useState('');
  const [reportType, setReportType] = useState('');

  const handleDelete = () => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return;
    deleteMutation.mutate(id, { onSuccess: () => router.push('/board') });
  };

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment.mutate(
      { boardId: id, content: comment },
      {
        onSuccess: () => {
          setComment('');
          toast.success('댓글이 등록되었습니다');
        },
        onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return;
    deleteComment.mutate(
      { boardId: id, commentId },
      {
        onSuccess: () => toast.success('댓글이 삭제되었습니다'),
        onError: () => toast.error('오류가 발생했습니다. 다시 시도해주세요'),
      }
    );
  };

  const openReport = (targetId: string, type: string) => {
    setReportTargetId(targetId);
    setReportType(type);
    setShowReport(true);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-4">
        {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl bg-gray-200 animate-pulse" />)}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-gray-400">
        <span className="text-5xl mb-3">😢</span>
        <p>게시글을 찾을 수 없습니다.</p>
        <Link href="/board" className="mt-4 text-teal-600 hover:underline">목록으로</Link>
      </div>
    );
  }

  const { board, comments } = data;
  const isOwner = user?.id === board.authorId;
  const displayName = board.isAnonymous ? '익명' : (board.author?.nickname ?? '익명');
  const displayAvatar = board.isAnonymous ? null : board.author?.profileImage;

  return (
    <>
      {showReport && (
        <ReportModal
          targetId={reportTargetId}
          targetType={reportType}
          onClose={() => setShowReport(false)}
        />
      )}

      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* 상단 배지 + 제목 */}
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${TYPE_COLOR[board.type] ?? 'bg-gray-100 text-gray-600'}`}>
              {TYPE_LABEL[board.type] ?? board.type}
            </span>
          </div>
          <h1 className="text-xl font-bold text-gray-900">{board.title}</h1>
        </div>

        {/* 작성자 정보 */}
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {displayAvatar ? (
              <Image src={displayAvatar} alt="프로필" width={36} height={36} className="rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-teal-700 text-sm font-bold">
                {displayName[0]}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-gray-900">{displayName}</p>
              <p className="text-xs text-gray-400">
                {new Date(board.createdAt).toLocaleString('ko-KR')} · 조회 {board.viewCount}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOwner ? (
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-xs text-red-500 hover:underline disabled:opacity-60"
              >
                삭제
              </button>
            ) : user && (
              <button
                onClick={() => openReport(board.id, 'BOARD')}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                🚨 신고
              </button>
            )}
          </div>
        </div>

        {/* 본문 */}
        <div className="mb-8 rounded-xl border border-gray-100 bg-white p-5">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{board.content}</p>
        </div>

        {/* 댓글 */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-gray-700">
            댓글 {comments.length}개
          </h2>

          {/* 댓글 입력 */}
          {user ? (
            <div className="mb-4 flex gap-2">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder={board.type === 'ANONYMOUS' ? '익명으로 댓글이 달립니다.' : '댓글을 입력하세요.'}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-teal-400"
              />
              <button
                onClick={handleComment}
                disabled={!comment.trim() || addComment.isPending}
                className="self-end rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 whitespace-nowrap"
              >
                {addComment.isPending ? '...' : '등록'}
              </button>
            </div>
          ) : (
            <div className="mb-4 rounded-xl bg-gray-50 border border-gray-100 p-4 text-center text-sm text-gray-500">
              <Link href="/login" className="text-teal-600 hover:underline">로그인</Link>하면 댓글을 달 수 있습니다.
            </div>
          )}

          {/* 댓글 목록 */}
          <div className="flex flex-col gap-1">
            {comments.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">아직 댓글이 없습니다.</p>
            ) : (
              comments.map((c) => {
                const cName = c.isAnonymous ? '익명' : (c.author?.nickname ?? '익명');
                const cAvatar = c.isAnonymous ? null : c.author?.profileImage;
                const isCommentOwner = user?.id === c.authorId;
                return (
                  <div key={c.id} className="rounded-xl bg-white border border-gray-100 p-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {cAvatar ? (
                          <Image src={cAvatar} alt="프로필" width={28} height={28} className="rounded-full object-cover" />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-bold">
                            {cName[0]}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-gray-800">{cName}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isCommentOwner || user?.role === 'ADMIN' ? (
                          <button
                            onClick={() => handleDeleteComment(c.id)}
                            disabled={deleteComment.isPending}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            삭제
                          </button>
                        ) : user ? (
                          <button
                            onClick={() => openReport(c.id, 'COMMENT')}
                            className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                          >
                            신고
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{c.content}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 목록으로 */}
        <div className="mt-8">
          <Link href="/board" className="text-sm text-teal-600 hover:underline">
            ← 목록으로
          </Link>
        </div>
      </div>
    </>
  );
}
