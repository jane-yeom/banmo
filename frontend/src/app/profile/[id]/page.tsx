'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import SubHeader from '@/components/layout/SubHeader';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import { useAuthStore } from '@/store/auth.store';
import { User, Post } from '@/types';
import NoteGradeBadge from '@/components/common/NoteGradeBadge';
import PostCard from '@/components/common/PostCard';
import AttachmentViewer from '@/components/common/AttachmentViewer';
import ResumeViewer from '@/components/common/ResumeViewer';
import { extractYoutubeId, getYoutubeEmbedUrl, getYoutubeThumbnail } from '@/lib/youtube';
import { Play, FileText, ChevronRight } from 'lucide-react';

function YoutubeIcon({ size = 16, color = '#FF0000' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

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

function VideoCard({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false)
  const videoId = extractYoutubeId(url)

  if (!videoId) return null

  const thumbnail = getYoutubeThumbnail(videoId)
  const embedUrl = getYoutubeEmbedUrl(videoId)

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: '1px solid #E8E4DC',
      marginBottom: 12,
    }}>
      {playing ? (
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
          <iframe
            src={`${embedUrl}?autoplay=1&rel=0&modestbranding=1`}
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              border: 'none',
            }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div
          onClick={() => setPlaying(true)}
          style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            cursor: 'pointer',
            background: '#000',
          }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbnail}
            alt="영상 썸네일"
            style={{
              position: 'absolute', top: 0, left: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              opacity: 0.85,
            }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              transition: 'transform 0.15s',
            }}>
              <Play
                size={28} color="#FF0000"
                fill="#FF0000" strokeWidth={0}
                style={{ marginLeft: 3 }}
              />
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 10, right: 10,
            background: 'rgba(0,0,0,0.6)',
            borderRadius: 4, padding: '3px 6px',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            <YoutubeIcon size={14} color="white" />
            <span style={{ color: 'white', fontSize: 10 }}>YouTube</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user: me } = useAuthStore();

  const { data: user, isLoading } = useUserProfile(id);
  const { data: postsData } = useUserPosts(id);

  const isMyProfile = me?.id === id;
  const isOwner = isMyProfile;
  const isRecruiter = false;
  const [showAttachment, setShowAttachment] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const videos = (user?.videoUrls ?? []).filter(v => v && extractYoutubeId(v));
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
      {showResume && (
        <ResumeViewer user={user} onClose={() => setShowResume(false)} />
      )}
      <SubHeader title="프로필" />
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">

        {/* 프로필 카드 */}
        <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
          <div className="h-24" style={{ background: 'linear-gradient(135deg, #1C1C1C, #4A52A0)' }} />
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
                  <div className="h-20 w-20 rounded-full border-4 border-white bg-indigo-200 flex items-center justify-center text-indigo-700 text-3xl font-bold shadow">
                    {(user.nickname ?? '?')[0]}
                  </div>
                )}
                <div className="mb-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900">
                      {user.nickname ?? '익명'}
                    </h1>
                    {(user as any).isVerified && (
                      <span style={{
                        fontSize: 11, background: '#EAF6EF',
                        color: '#5AAB7A', border: '1px solid #5AAB7A',
                        borderRadius: 99, padding: '2px 8px', fontWeight: 700,
                      }}>
                        ✓ 인증
                      </span>
                    )}
                  </div>
                  <NoteGradeBadge grade={user.noteGrade} size="md" />
                </div>
              </div>

              <div className="mt-12 flex gap-2">
                <button onClick={() => setShowResume(true)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px',
                  background: '#1C1C1C', color: 'white',
                  border: 'none', borderRadius: 8,
                  fontSize: 12, fontWeight: 600,
                  cursor: 'pointer',
                }}>
                  <FileText size={14} />
                  이력서 보기
                </button>
                {isMyProfile && (
                  <Link
                    href="/profile/edit"
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    프로필 편집
                  </Link>
                )}
              </div>
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
                    className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-0.5 text-xs text-indigo-700 font-medium"
                  >
                    🎵 {inst}
                  </span>
                ))}
              </div>
            )}

            {/* 자기소개 */}
            {(user as any).isBioPublic !== false && user.bio && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 rounded-xl p-4">
                {user.bio}
              </p>
            )}
          </div>
        </div>

        {/* 이력사항 */}
        {(user as any).isCareerPublic && (user as any).career && (
          <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
            <h2 className="text-base font-bold text-gray-800 mb-3">📄 이력사항</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{(user as any).career}</p>
          </div>
        )}

        {/* 첨부파일 */}
        {((user as any).isAttachmentPublic || isOwner || isRecruiter) && (user as any).attachmentUrl && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 15, fontWeight: 700,
              marginBottom: 12, color: '#1A1A1A',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <FileText size={16} strokeWidth={1.8} />
              첨부파일
              {!(user as any).isAttachmentPublic && (
                <span style={{
                  fontSize: 11, color: '#D4A03A',
                  background: '#FEF6E4', borderRadius: 4,
                  padding: '2px 6px', fontWeight: 500,
                }}>비공개</span>
              )}
            </h3>

            <div
              onClick={() => setShowAttachment(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                background: '#F7F4ED',
                border: '1px solid #E8E4DC',
                borderRadius: 12, cursor: 'pointer',
                transition: 'background 0.15s',
              }}>
              <div style={{
                width: 44, height: 44,
                background: '#1C1C1C', borderRadius: 10,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', flexShrink: 0,
              }}>
                <FileText size={22} color="white" strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 600,
                  color: '#1A1A1A', marginBottom: 2,
                  overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {(user as any).attachmentName || '첨부파일'}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  탭해서 보기
                </div>
              </div>
              <ChevronRight size={18} color="#9CA3AF" />
            </div>
          </div>
        )}

        {showAttachment && (user as any).attachmentUrl && (
          <AttachmentViewer
            attachmentUrl={(user as any).attachmentUrl}
            attachmentName={(user as any).attachmentName || '첨부파일'}
            onClose={() => setShowAttachment(false)}
          />
        )}

        {/* 비공개 항목 안내 */}
        {!isMyProfile && ((user as any).isCareerPublic === false || (user as any).isAttachmentPublic === false) && (
          <div style={{
            background: '#F7F4ED', borderRadius: 10,
            padding: '10px 14px', fontSize: 12,
            color: '#9CA3AF', textAlign: 'center',
          }}>
            🔒 일부 정보는 비공개 설정되어 있습니다
          </div>
        )}

        {/* 연주 영상 */}
        {user.videoUrls && user.videoUrls.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{
              fontSize: 15, fontWeight: 700,
              marginBottom: 12, color: '#1A1A1A',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <YoutubeIcon size={16} color="#FF0000" />
              연주 영상
            </h3>
            {user.videoUrls.map((url: string, i: number) => (
              <VideoCard key={i} url={url} />
            ))}
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
