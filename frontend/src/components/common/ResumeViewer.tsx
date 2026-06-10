'use client'
import { X, Music, MapPin, User, FileText } from 'lucide-react'
import { extractYoutubeId, getYoutubeThumbnail } from '@/lib/youtube'
import { useState } from 'react'

interface ResumeViewerProps {
  user: any
  onClose: () => void
}

function YoutubeIcon({ size = 13, color = '#FF0000' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  )
}

function VideoThumb({ url, onClick }: { url: string; onClick: () => void }) {
  const id = extractYoutubeId(url)
  if (!id) return null
  return (
    <div onClick={onClick} style={{
      position: 'relative', borderRadius: 10,
      overflow: 'hidden', cursor: 'pointer',
      aspectRatio: '16/9', background: '#000',
    }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={getYoutubeThumbnail(id)} alt="썸네일"
        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          background: 'rgba(255,255,255,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 0, height: 0,
            borderTop: '10px solid transparent',
            borderBottom: '10px solid transparent',
            borderLeft: '16px solid #FF0000',
            marginLeft: 3,
          }} />
        </div>
      </div>
    </div>
  )
}

export default function ResumeViewer({ user, onClose }: ResumeViewerProps) {
  const [playingUrl, setPlayingUrl] = useState<string | null>(null)

  const noteGradeLabel = (grade: string) => {
    const map: Record<string, string> = {
      WHOLE: '♩ 온음표', HALF: '♩ 2분음표',
      QUARTER: '♩ 4분음표', EIGHTH: '♪ 8분음표',
      SIXTEENTH: '♬ 16분음표',
    }
    return map[grade] || grade
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center',
      overflowY: 'auto',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#F7F4ED',
          borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 600,
          maxHeight: '92vh',
          overflowY: 'auto',
          paddingBottom: 40,
        }}>

        {/* 헤더 */}
        <div style={{
          position: 'sticky', top: 0,
          background: '#F7F4ED', zIndex: 10,
          padding: '16px 20px 12px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E8E4DC',
        }}>
          <span style={{ fontSize: 16, fontWeight: 700 }}>프로필 상세</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
          }}>
            <X size={22} color="#555" />
          </button>
        </div>

        {/* 상단 프로필 */}
        <div style={{
          background: '#1C1C1C',
          padding: '28px 24px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#444', overflow: 'hidden',
            flexShrink: 0, border: '3px solid rgba(255,255,255,0.2)',
          }}>
            {user.profileImage
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.profileImage} alt="프로필"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )
              : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, color: 'white',
                }}>
                  {user.nickname?.charAt(0)}
                </div>
              )
            }
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'white', marginBottom: 4 }}>
              {user.nickname}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{
                background: 'rgba(255,255,255,0.15)',
                color: 'white', fontSize: 12, fontWeight: 600,
                padding: '3px 10px', borderRadius: 99,
              }}>
                {noteGradeLabel(user.noteGrade)}
              </span>
              {user.isVerified && (
                <span style={{
                  background: '#5AAB7A', color: 'white',
                  fontSize: 12, fontWeight: 600,
                  padding: '3px 10px', borderRadius: 99,
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  ✓ 인증
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px' }}>

          {/* 기본 정보 */}
          <div style={{
            background: 'white', borderRadius: 14,
            padding: '18px', marginTop: 16,
            border: '1px solid #E8E4DC',
          }}>
            <h3 style={{
              fontSize: 13, fontWeight: 700, color: '#888',
              marginBottom: 14, textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>기본 정보</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {user.isInstrumentsPublic && user.instruments?.length > 0 && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, background: '#F0EDE6',
                    borderRadius: 9, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Music size={17} strokeWidth={1.8} color="#1C1C1C" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>악기</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {user.instruments.map((inst: string) => (
                        <span key={inst} style={{
                          background: '#F0EDE6', color: '#1C1C1C',
                          fontSize: 13, fontWeight: 500,
                          padding: '3px 10px', borderRadius: 99,
                        }}>{inst}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {user.isRegionPublic && user.region && (
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, background: '#F0EDE6',
                    borderRadius: 9, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MapPin size={17} strokeWidth={1.8} color="#1C1C1C" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>활동 지역</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{user.region}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 자기소개 */}
          {user.isBioPublic && user.bio && (
            <div style={{
              background: 'white', borderRadius: 14,
              padding: '18px', marginTop: 12,
              border: '1px solid #E8E4DC',
            }}>
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: '#888',
                marginBottom: 12, textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <User size={13} /> 자기소개
              </h3>
              <p style={{
                fontSize: 14, color: '#333',
                lineHeight: 1.8, margin: 0,
                whiteSpace: 'pre-line',
              }}>
                {user.bio}
              </p>
            </div>
          )}

          {/* 이력사항 */}
          {user.isCareerPublic && user.career && (
            <div style={{
              background: 'white', borderRadius: 14,
              padding: '18px', marginTop: 12,
              border: '1px solid #E8E4DC',
            }}>
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: '#888',
                marginBottom: 12, textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <FileText size={13} /> 이력사항
              </h3>
              <p style={{
                fontSize: 14, color: '#333',
                lineHeight: 1.9, margin: 0,
                whiteSpace: 'pre-line',
              }}>
                {user.career}
              </p>
            </div>
          )}

          {/* 연주 영상 */}
          {user.videoUrls && user.videoUrls.length > 0 && (
            <div style={{
              background: 'white', borderRadius: 14,
              padding: '18px', marginTop: 12,
              border: '1px solid #E8E4DC',
            }}>
              <h3 style={{
                fontSize: 13, fontWeight: 700, color: '#888',
                marginBottom: 14, textTransform: 'uppercase',
                letterSpacing: '0.05em',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <YoutubeIcon size={13} color="#FF0000" /> 연주 영상
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {user.videoUrls.map((url: string, i: number) => {
                  const videoId = extractYoutubeId(url)
                  if (!videoId) return null
                  const embedUrl = `https://www.youtube.com/embed/${videoId}`
                  return (
                    <div key={i} style={{ borderRadius: 10, overflow: 'hidden' }}>
                      {playingUrl === url ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                          <iframe
                            src={`${embedUrl}?autoplay=1&rel=0`}
                            style={{
                              position: 'absolute', top: 0, left: 0,
                              width: '100%', height: '100%', border: 'none',
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <VideoThumb url={url} onClick={() => setPlayingUrl(url)} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 아무 내용 없을 때 */}
          {!user.bio && !user.career && (!user.videoUrls || user.videoUrls.length === 0) && (
            <div style={{
              textAlign: 'center', padding: '40px 20px',
              color: '#9CA3AF',
            }}>
              <User size={40} color="#E8E4DC" strokeWidth={1} />
              <div style={{ fontSize: 14, marginTop: 12 }}>
                아직 작성된 프로필 내용이 없어요
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
