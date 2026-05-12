'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import { uploadImage } from '@/lib/upload';
import SubHeader from '@/components/layout/SubHeader';
import { Plus, X } from 'lucide-react';
import { extractYoutubeId, getYoutubeThumbnail, isValidYoutubeUrl } from '@/lib/youtube';

function YoutubeIcon({ size = 18, color = '#FF0000' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

const INSTRUMENTS = [
  '피아노', '바이올린', '비올라', '첼로', '콘트라베이스',
  '플루트', '오보에', '클라리넷', '바순', '호른',
  '트럼펫', '트롬본', '타악기', '기타', '하프',
];

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구',
  '광주', '대전', '울산', '세종', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function WelcomePage() {
  const router = useRouter();
  const { user, setAuth, accessToken } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [region, setRegion] = useState('');
  const [bio, setBio] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState('');
  const [videoError, setVideoError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [agreed, setAgreed] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);

  // 로그인 안된 경우 리다이렉트
  useEffect(() => {
    // zustand hydration 대기
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().isLoggedIn) {
        router.replace('/login');
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [router]);

  // 유저 정보 초기화 (hydration 후)
  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setProfileImage(user.profileImage || '');
    }
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setProfileImage(url);
    } catch {
      alert('이미지 업로드 실패');
    } finally {
      setUploading(false);
    }
  };

  const toggleInstrument = (inst: string) => {
    setSelectedInstruments(prev =>
      prev.includes(inst) ? prev.filter(i => i !== inst) : [...prev, inst]
    );
  };

  const handleAddVideo = () => {
    setVideoError('');
    if (!videoInput.trim()) return;
    if (!isValidYoutubeUrl(videoInput)) {
      setVideoError('올바른 유튜브 URL을 입력해주세요');
      return;
    }
    if (videoUrls.length >= 5) {
      setVideoError('최대 5개까지 등록 가능합니다');
      return;
    }
    if (videoUrls.includes(videoInput.trim())) {
      setVideoError('이미 추가된 영상입니다');
      return;
    }
    setVideoUrls(prev => [...prev, videoInput.trim()]);
    setVideoInput('');
  };

  const handleSave = async () => {
    if (!nickname.trim() || nickname.trim().length < 2) {
      alert('닉네임을 2자 이상 입력해주세요');
      return;
    }

    setSaving(true);
    try {
      const res = await api.patch('/users/me', {
        nickname: nickname.trim(),
        profileImage,
        instruments: selectedInstruments,
        region,
        bio,
        videoUrls,
      });

      const updatedUser = res.data.data || res.data;
      setAuth(updatedUser, accessToken!);

      router.replace('/');
    } catch (e: any) {
      alert(e.response?.data?.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>
      <SubHeader title="반모 시작하기" hideBack />
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '20px',
      }}>
      <div style={{
        background: 'white', borderRadius: 16,
        padding: '40px', width: '100%', maxWidth: 480,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      }}>
        {/* 헤더 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/banmo-logo.png" alt="반모"
            style={{ height: 56, width: 'auto', marginBottom: 12 }}/>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            반모에 오신걸 환영해요!
          </h1>
          <p style={{ color: '#6B7280', fontSize: 14 }}>
            프로필을 설정하고 시작해보세요
          </p>
        </div>

        {/* 스텝 표시 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {[1, 2].map(s => (
            <div key={s} style={{
              flex: 1, height: 4, borderRadius: 2,
              background: s <= step ? '#7B82BE' : '#E5E7EB',
              transition: 'background 0.3s',
            }}/>
          ))}
        </div>

        {step === 1 && (
          <div>
            {/* 프로필 이미지 */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  width: 100, height: 100,
                  borderRadius: '50%', margin: '0 auto 12px',
                  background: profileImage ? 'transparent' : '#ECEAF8',
                  cursor: 'pointer', overflow: 'hidden',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', position: 'relative',
                  border: '3px solid #7B82BE',
                }}>
                {profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profileImage} alt="프로필"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                ) : (
                  <span style={{ fontSize: 36 }}>👤</span>
                )}
                {uploading && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white',
                    fontSize: 12,
                  }}>
                    업로드 중...
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file"
                accept="image/*" onChange={handleImageChange}
                style={{ display: 'none' }}/>
              <p style={{ fontSize: 13, color: '#7B82BE', cursor: 'pointer' }}
                onClick={() => fileRef.current?.click()}>
                프로필 사진 변경
              </p>
            </div>

            {/* 닉네임 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 14,
                fontWeight: 600, marginBottom: 6, color: '#374151',
              }}>
                닉네임 <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                placeholder="사용할 닉네임을 입력해주세요"
                maxLength={20}
                style={{
                  width: '100%', padding: '12px',
                  border: '1px solid #E5E7EB', borderRadius: 8,
                  fontSize: 15, boxSizing: 'border-box',
                  outline: 'none',
                }}/>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                2~20자, 나중에 변경 가능해요
              </p>
            </div>

            {/* 자기소개 */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 14,
                fontWeight: 600, marginBottom: 6, color: '#374151',
              }}>
                자기소개 (선택)
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="간단한 자기소개를 입력해주세요"
                maxLength={200}
                rows={3}
                style={{
                  width: '100%', padding: '12px',
                  border: '1px solid #E5E7EB', borderRadius: 8,
                  fontSize: 14, boxSizing: 'border-box',
                  resize: 'none', outline: 'none',
                }}/>
            </div>

            {/* 약관 동의 */}
            <div style={{ marginBottom: 20 }}>
              <div style={{
                display: 'flex', alignItems: 'center',
                gap: 8, marginBottom: 8,
              }}>
                <input
                  type="checkbox"
                  id="agree-all"
                  checked={agreed && agreedPrivacy}
                  onChange={e => {
                    setAgreed(e.target.checked);
                    setAgreedPrivacy(e.target.checked);
                  }}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#7B82BE' }}
                />
                <label htmlFor="agree-all" style={{ fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  전체 동의
                </label>
              </div>
              <div style={{
                borderTop: '0.5px solid #DDD9EF',
                paddingTop: 8, display: 'flex',
                flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="agree-terms"
                      checked={agreed}
                      onChange={e => setAgreed(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#7B82BE' }}
                    />
                    <label htmlFor="agree-terms" style={{ fontSize: 13, cursor: 'pointer' }}>
                      <span style={{ color: '#7B82BE', fontWeight: 600 }}>[필수] </span>
                      이용약관 동의
                    </label>
                  </div>
                  <a href="/terms" target="_blank" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'underline' }}>
                    보기
                  </a>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input type="checkbox" id="agree-privacy"
                      checked={agreedPrivacy}
                      onChange={e => setAgreedPrivacy(e.target.checked)}
                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#7B82BE' }}
                    />
                    <label htmlFor="agree-privacy" style={{ fontSize: 13, cursor: 'pointer' }}>
                      <span style={{ color: '#7B82BE', fontWeight: 600 }}>[필수] </span>
                      개인정보처리방침 동의
                    </label>
                  </div>
                  <a href="/privacy" target="_blank" style={{ fontSize: 12, color: '#9CA3AF', textDecoration: 'underline' }}>
                    보기
                  </a>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                if (!nickname.trim() || nickname.trim().length < 2) {
                  alert('닉네임을 2자 이상 입력해주세요');
                  return;
                }
                if (!agreed || !agreedPrivacy) {
                  alert('이용약관과 개인정보처리방침에 동의해주세요');
                  return;
                }
                setStep(2);
              }}
              style={{
                width: '100%', padding: '14px',
                background: '#7B82BE', color: 'white',
                border: 'none', borderRadius: 12,
                fontSize: 16, fontWeight: 600,
                cursor: 'pointer',
              }}>
              다음 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            {/* 악기 선택 */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 14,
                fontWeight: 600, marginBottom: 12, color: '#374151',
              }}>
                악기 선택 (선택, 복수 가능)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {INSTRUMENTS.map(inst => (
                  <button
                    key={inst}
                    onClick={() => toggleInstrument(inst)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 99,
                      border: `1px solid ${selectedInstruments.includes(inst) ? '#7B82BE' : '#E5E7EB'}`,
                      background: selectedInstruments.includes(inst) ? '#ECEAF8' : 'white',
                      color: selectedInstruments.includes(inst) ? '#7B82BE' : '#374151',
                      fontSize: 13, cursor: 'pointer',
                      fontWeight: selectedInstruments.includes(inst) ? 600 : 400,
                    }}>
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            {/* 연주 영상 */}
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 14,
                fontWeight: 600, marginBottom: 8, color: '#374151',
              }}>
                연주 영상 <span style={{ fontSize: 12, color: '#9CA3AF', fontWeight: 400 }}>유튜브 링크 (선택, 최대 5개)</span>
              </label>
              <p style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6, marginBottom: 10 }}>
                유튜브에 올린 연주 영상 링크를 등록하세요.<br />
                비공개 영상도 링크만 있으면 등록 가능해요!
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                  border: '1.5px solid #DDD9EF', borderRadius: 12,
                  padding: '0 12px', background: 'white',
                }}>
                  <YoutubeIcon size={18} />
                  <input
                    value={videoInput}
                    onChange={e => { setVideoInput(e.target.value); setVideoError(''); }}
                    onKeyDown={e => e.key === 'Enter' && handleAddVideo()}
                    placeholder="유튜브 링크를 붙여넣으세요"
                    style={{
                      flex: 1, border: 'none', outline: 'none',
                      fontSize: 14, padding: '12px 0', background: 'transparent',
                    }}
                  />
                </div>
                <button
                  onClick={handleAddVideo}
                  style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: '#7B82BE', border: 'none',
                    cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                  <Plus size={20} color="white" strokeWidth={2.5} />
                </button>
              </div>
              {videoError && (
                <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 6 }}>⚠️ {videoError}</p>
              )}
              {videoUrls.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {videoUrls.map((url, i) => {
                    const videoId = extractYoutubeId(url);
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        background: 'white', borderRadius: 10,
                        border: '1px solid #E5E7EB', padding: '6px 8px',
                      }}>
                        {videoId && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={getYoutubeThumbnail(videoId)}
                            alt="썸네일"
                            style={{ width: 64, height: 44, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <p style={{
                          flex: 1, fontSize: 12, color: '#444',
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap', margin: 0,
                        }}>{url}</p>
                        <button
                          onClick={() => setVideoUrls(prev => prev.filter(v => v !== url))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
                          <X size={16} color="#9CA3AF" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 지역 선택 */}
            <div style={{ marginBottom: 32 }}>
              <label style={{
                display: 'block', fontSize: 14,
                fontWeight: 600, marginBottom: 6, color: '#374151',
              }}>
                활동 지역 (선택)
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                style={{
                  width: '100%', padding: '12px',
                  border: '1px solid #E5E7EB', borderRadius: 8,
                  fontSize: 14, boxSizing: 'border-box',
                  background: 'white',
                }}>
                <option value="">지역 선택</option>
                {REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStep(1)}
                style={{
                  flex: 1, padding: '14px',
                  background: 'white', color: '#374151',
                  border: '1px solid #E5E7EB', borderRadius: 12,
                  fontSize: 15, cursor: 'pointer',
                }}>
                ← 이전
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex: 2, padding: '14px',
                  background: saving ? '#9CA3AF' : '#7B82BE',
                  color: 'white', border: 'none',
                  borderRadius: 12, fontSize: 16,
                  fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
                }}>
                {saving ? '저장 중...' : '시작하기 🎵'}
              </button>
            </div>

            <button
              onClick={() => router.replace('/')}
              style={{
                width: '100%', marginTop: 12,
                background: 'none', border: 'none',
                color: '#9CA3AF', fontSize: 13,
                cursor: 'pointer', padding: '8px',
              }}>
              나중에 설정할게요
            </button>
          </div>
        )}

        {/* 개인정보 안내 */}
        <div style={{
          marginTop: 24, padding: '10px 14px',
          background: '#FFF7ED', borderRadius: 10,
          border: '1px solid #FED7AA',
          fontSize: 11, color: '#92400E', lineHeight: 1.6,
        }}>
          📌 카카오 로그인 시 수집된 원본 정보(닉네임·이메일·프로필 사진)는 서비스 약관 및 관련 법령에 따라 내부적으로 안전하게 보존됩니다. 해당 정보는 악의적 이용자 추적 및 법적 대응 목적으로만 사용되며, 외부에 공개되지 않습니다.
        </div>
      </div>
      </div>
    </div>
  );
}
