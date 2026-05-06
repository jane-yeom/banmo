'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import { uploadImage } from '@/lib/upload';

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
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

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
    <div style={{
      minHeight: '100vh', background: '#F9FAFB',
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
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎵</div>
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
              background: s <= step ? '#7C3AED' : '#E5E7EB',
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
                  background: profileImage ? 'transparent' : '#EDE9FE',
                  cursor: 'pointer', overflow: 'hidden',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', position: 'relative',
                  border: '3px solid #7C3AED',
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
              <p style={{ fontSize: 13, color: '#7C3AED', cursor: 'pointer' }}
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

            <button
              onClick={() => {
                if (!nickname.trim() || nickname.trim().length < 2) {
                  alert('닉네임을 2자 이상 입력해주세요');
                  return;
                }
                setStep(2);
              }}
              style={{
                width: '100%', padding: '14px',
                background: '#7C3AED', color: 'white',
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
                      border: `1px solid ${selectedInstruments.includes(inst) ? '#7C3AED' : '#E5E7EB'}`,
                      background: selectedInstruments.includes(inst) ? '#EDE9FE' : 'white',
                      color: selectedInstruments.includes(inst) ? '#7C3AED' : '#374151',
                      fontSize: 13, cursor: 'pointer',
                      fontWeight: selectedInstruments.includes(inst) ? 600 : 400,
                    }}>
                    {inst}
                  </button>
                ))}
              </div>
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
                  background: saving ? '#9CA3AF' : '#7C3AED',
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
      </div>
    </div>
  );
}
