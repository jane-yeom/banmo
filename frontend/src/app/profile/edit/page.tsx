'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import { uploadImage } from '@/lib/upload';
import SubHeader from '@/components/layout/SubHeader';
import { Eye, EyeOff, Upload, X, FileText, Plus, ExternalLink, User, AlertTriangle, Lock, CheckCircle, Info, ClipboardList } from 'lucide-react';
import InstrumentSelect from '@/components/common/InstrumentSelect';
import { extractYoutubeId, getYoutubeThumbnail, isValidYoutubeUrl } from '@/lib/youtube';

function YoutubeIcon({ size = 20, color = '#FF0000' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구',
  '광주', '대전', '울산', '세종', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

function VisibilityToggle({
  value, onChange,
}: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        background: value ? '#F0EDE6' : '#F7F4ED',
        border: `1px solid ${value ? '#1C1C1C' : '#E8E4DC'}`,
        borderRadius: 99, padding: '4px 10px',
        cursor: 'pointer', fontSize: 12,
        color: value ? '#000000' : '#9CA3AF',
        fontWeight: 600, flexShrink: 0,
      }}
    >
      {value
        ? <><Eye size={12} strokeWidth={2} /> 공개</>
        : <><EyeOff size={12} strokeWidth={2} /> 비공개</>}
    </button>
  );
}

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, accessToken, setAuth } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const attachRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    nickname: '',
    profileImage: '',
    bio: '',
    career: '',
    region: '',
    instruments: [] as string[],
    attachmentUrl: '',
    attachmentName: '',
    isBioPublic: true,
    isCareerPublic: false,
    isAttachmentPublic: false,
    isInstrumentsPublic: true,
    isRegionPublic: true,
  });
  const [videoUrls, setVideoUrls] = useState<string[]>([]);
  const [videoInput, setVideoInput] = useState('');
  const [videoError, setVideoError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [attachUploading, setAttachUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setVideoUrls((user as any).videoUrls || []);
      setForm({
        nickname: user.nickname || '',
        profileImage: user.profileImage || '',
        bio: (user as any).bio || '',
        career: (user as any).career || '',
        region: (user as any).region || '',
        instruments: (user as any).instruments || [],
        attachmentUrl: (user as any).attachmentUrl || '',
        attachmentName: (user as any).attachmentName || '',
        isBioPublic: (user as any).isBioPublic ?? true,
        isCareerPublic: (user as any).isCareerPublic ?? false,
        isAttachmentPublic: (user as any).isAttachmentPublic ?? false,
        isInstrumentsPublic: (user as any).isInstrumentsPublic ?? true,
        isRegionPublic: (user as any).isRegionPublic ?? true,
      });
    }
  }, [user]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm(prev => ({ ...prev, profileImage: url }));
    } catch { alert('이미지 업로드 실패'); }
    finally { setUploading(false); }
  };

  const handleAttachChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하만 가능합니다');
      return;
    }
    setAttachUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${apiUrl}/media/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error('업로드 실패');
      const data = await res.json();
      const url = data.url || data.data?.url;
      setForm(prev => ({ ...prev, attachmentUrl: url, attachmentName: file.name }));
      alert('파일이 업로드되었습니다');
    } catch (e) {
      console.error('첨부파일 업로드 에러:', e);
      alert('파일 업로드에 실패했습니다');
    } finally {
      setAttachUploading(false);
      if (attachRef.current) attachRef.current.value = '';
    }
  };

  const handleAddVideo = () => {
    setVideoError('');
    const url = videoInput.trim();
    if (!url) return;
    if (!isValidYoutubeUrl(url)) {
      setVideoError('올바른 유튜브 URL을 입력해주세요');
      return;
    }
    if (videoUrls.length >= 5) {
      setVideoError('최대 5개까지 등록 가능합니다');
      return;
    }
    if (videoUrls.includes(url)) {
      setVideoError('이미 추가된 영상입니다');
      return;
    }
    setVideoUrls(prev => [...prev, url]);
    setVideoInput('');
    console.log('영상 추가됨:', url, '현재 목록:', [...videoUrls, url]);
  };

  const handleRemoveVideo = (url: string) => {
    setVideoUrls(prev => prev.filter(v => v !== url));
  };

  const handleSave = async () => {
    if (!form.nickname.trim()) return alert('닉네임을 입력해주세요');
    if (form.nickname.trim().length < 2) return alert('닉네임은 2자 이상이어야 합니다');
    setSaving(true);
    try {
      const payload = {
        nickname: form.nickname,
        profileImage: form.profileImage || null,
        bio: form.bio || null,
        career: form.career || null,
        region: form.region || null,
        instruments: form.instruments || [],
        attachmentUrl: form.attachmentUrl || null,
        attachmentName: form.attachmentName || null,
        videoUrls: videoUrls || [],
        isBioPublic: form.isBioPublic,
        isCareerPublic: form.isCareerPublic,
        isAttachmentPublic: form.isAttachmentPublic,
        isInstrumentsPublic: form.isInstrumentsPublic,
        isRegionPublic: form.isRegionPublic,
      };
      console.log('저장 payload:', payload);
      const res = await api.patch('/users/me', payload);
      const updated = res.data?.data || res.data;
      setAuth(updated, accessToken!);
      alert('프로필이 저장되었습니다');
      router.back();
    } catch (e: any) {
      console.error('저장 에러:', e);
      alert(e.response?.data?.message || '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      <SubHeader
        title="프로필 편집"
        rightElement={
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: '8px 18px',
              background: saving ? '#ccc' : '#1C1C1C',
              color: 'white', border: 'none',
              borderRadius: 99, fontSize: 14,
              fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        }
      />

      <div style={{ padding: '24px 16px 100px', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* 프로필 이미지 */}
        <div style={{ textAlign: 'center' }}>
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              width: 90, height: 90, borderRadius: '50%',
              margin: '0 auto 10px',
              background: form.profileImage ? 'transparent' : '#F0EDE6',
              cursor: 'pointer', overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid #1C1C1C', position: 'relative',
            }}
          >
            {form.profileImage
              ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.profileImage} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )
              : <User size={36} color="#1C1C1C" />}
            {uploading && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.4)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'white', fontSize: 12,
              }}>업로드 중...</div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
          <button type="button" onClick={() => fileRef.current?.click()} style={{
            background: 'none', border: 'none',
            color: '#1C1C1C', fontSize: 13,
            fontWeight: 600, cursor: 'pointer',
          }}>
            사진 변경
          </button>
        </div>

        {/* 닉네임 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            닉네임 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <input
            value={form.nickname}
            onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
            placeholder="닉네임 입력"
            maxLength={20}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            카카오 계정 원본 정보는 보존됩니다
          </p>
        </div>

        {/* 악기 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>악기</label>
            <VisibilityToggle
              value={form.isInstrumentsPublic}
              onChange={v => setForm(p => ({ ...p, isInstrumentsPublic: v }))}
            />
          </div>
          <InstrumentSelect
            value={form.instruments}
            onChange={instruments => setForm(p => ({ ...p, instruments }))}
          />
        </div>

        {/* 활동 지역 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>활동 지역</label>
            <VisibilityToggle
              value={form.isRegionPublic}
              onChange={v => setForm(p => ({ ...p, isRegionPublic: v }))}
            />
          </div>
          <select
            value={form.region}
            onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, background: 'white',
              outline: 'none', boxSizing: 'border-box',
            }}
          >
            <option value="">지역 선택</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* 자기소개 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>
              자기소개
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>간략하게</span>
            </label>
            <VisibilityToggle
              value={form.isBioPublic}
              onChange={v => setForm(p => ({ ...p, isBioPublic: v }))}
            />
          </div>
          <textarea
            value={form.bio}
            onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
            placeholder={`간단한 자기소개를 입력해주세요\n예) 음대 피아노과 졸업, 반주 경력 5년입니다.`}
            maxLength={200}
            rows={6}
            style={{
              width: '100%', padding: '14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 14, outline: 'none',
              resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.7, minHeight: 120,
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            {form.bio.length}/200
          </div>
          {!form.isBioPublic && (
            <p style={{ fontSize: 11, color: '#D4A03A', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={11} strokeWidth={2} /> 비공개 설정 시 다른 사람에게 보이지 않지만, 공고 지원 시 채용자에게는 공개됩니다
            </p>
          )}
        </div>

        {/* 이력사항 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>
              이력사항
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>경력, 학력, 수상 이력 등</span>
            </label>
            <VisibilityToggle
              value={form.isCareerPublic}
              onChange={v => setForm(p => ({ ...p, isCareerPublic: v }))}
            />
          </div>
          <textarea
            value={form.career}
            onChange={e => setForm(p => ({ ...p, career: e.target.value }))}
            placeholder={`이력사항을 자세히 입력해주세요\n\n예)\n학력\n- 서울대학교 음악대학 피아노과 졸업 (2020)\n\n경력\n- OO 합창단 반주 (2020~현재)\n- OO 음악학원 강사 (2021~2023)\n\n수상\n- 제○회 한국음악협회 콩쿠르 입상 (2019)`}
            rows={10}
            style={{
              width: '100%', padding: '14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 14, outline: 'none',
              resize: 'vertical', boxSizing: 'border-box',
              lineHeight: 1.8, minHeight: 200,
            }}
          />
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            {form.isCareerPublic
              ? <><CheckCircle size={11} strokeWidth={2} color="#5AAB7A" /> 프로필에 공개됩니다</>
              : <><Lock size={11} strokeWidth={2} /> 기본 비공개. 공고 지원 시 채용자에게만 공개됩니다</>}
          </p>
        </div>

        {/* 첨부파일 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>
              첨부파일
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>포트폴리오, 졸업증명서 등</span>
            </label>
            <VisibilityToggle
              value={form.isAttachmentPublic}
              onChange={v => setForm(p => ({ ...p, isAttachmentPublic: v }))}
            />
          </div>

          {form.attachmentUrl ? (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px',
              background: '#F7F4ED', borderRadius: 12,
              border: '1.5px solid #E8E4DC',
            }}>
              <FileText size={20} color="#1C1C1C" strokeWidth={1.8} />
              <span style={{ flex: 1, fontSize: 13, color: '#444', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {form.attachmentName || '첨부파일'}
              </span>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, attachmentUrl: '', attachmentName: '' }))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
              >
                <X size={16} color="#9CA3AF" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => attachRef.current?.click()}
              style={{
                border: '1.5px dashed #E8E4DC', borderRadius: 12,
                padding: '28px 20px', textAlign: 'center',
                cursor: 'pointer', background: '#FAFAFA',
                minHeight: 100, display: 'flex',
                flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              {attachUploading ? (
                <p style={{ fontSize: 13, color: '#9CA3AF' }}>업로드 중...</p>
              ) : (
                <>
                  <Upload size={24} color="#9CA3AF" strokeWidth={1.5} />
                  <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>파일을 탭해서 업로드하세요</p>
                  <p style={{ fontSize: 11, color: '#DDDDDD', margin: 0 }}>PDF, 이미지 등 최대 10MB</p>
                </>
              )}
            </div>
          )}
          <input
            ref={attachRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            onChange={handleAttachChange}
            style={{ display: 'none' }}
          />
          <p style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            {form.isAttachmentPublic
              ? <><CheckCircle size={11} strokeWidth={2} color="#5AAB7A" /> 프로필에 공개됩니다</>
              : <><Lock size={11} strokeWidth={2} /> 기본 비공개. 공고 지원 시 채용자에게만 공개됩니다</>}
          </p>
        </div>

        {/* 연주 영상 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#444' }}>
              연주 영상
              <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>
                유튜브 링크 (최대 5개)
              </span>
            </label>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>{videoUrls.length}/5</span>
          </div>

          {/* URL 입력 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 8,
              border: '1.5px solid #E8E4DC', borderRadius: 12,
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
              type="button"
              onClick={handleAddVideo}
              style={{
                width: 44, height: 44, borderRadius: 12,
                background: '#1C1C1C', border: 'none',
                cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
              <Plus size={20} color="white" strokeWidth={2.5} />
            </button>
          </div>

          {/* 에러 메시지 */}
          {videoError && (
            <p style={{ fontSize: 12, color: '#EF4444', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={13} strokeWidth={1.8} /> {videoError}
            </p>
          )}

          {/* 안내 문구 */}
          <div style={{
            background: '#F7F4ED', borderRadius: 10,
            padding: '10px 12px', marginBottom: 12,
            fontSize: 12, color: '#6B7280', lineHeight: 1.6,
            display: 'flex', alignItems: 'flex-start', gap: 6,
          }}>
            <Info size={13} strokeWidth={1.8} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 2 }} />
            <span>유튜브에 <strong>비공개</strong>로 올린 영상도 링크만 있으면 등록 가능해요.<br />
            일반 공개 또는 링크 공개로 설정된 영상을 추천드려요.</span>
          </div>

          {/* 등록된 영상 목록 */}
          {videoUrls.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {videoUrls.map((url, i) => {
                const videoId = extractYoutubeId(url);
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: 'white', borderRadius: 12,
                    border: '1px solid #E8E4DC', padding: '8px',
                  }}>
                    {videoId ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getYoutubeThumbnail(videoId)}
                        alt="썸네일"
                        style={{
                          width: 80, height: 54, borderRadius: 8,
                          objectFit: 'cover', flexShrink: 0, background: '#F7F4ED',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 80, height: 54, borderRadius: 8,
                        background: '#F7F4ED', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <YoutubeIcon size={20} />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 12, color: '#444',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', margin: 0,
                      }}>
                        {url}
                      </p>
                      <a href={url} target="_blank" rel="noopener noreferrer"
                        style={{
                          fontSize: 11, color: '#1C1C1C',
                          display: 'flex', alignItems: 'center', gap: 3,
                          textDecoration: 'none', marginTop: 3,
                        }}>
                        <ExternalLink size={10} /> 열어보기
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveVideo(url)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                      <X size={18} color="#9CA3AF" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 공개 안내 박스 */}
        <div style={{
          background: '#FEF6E4', borderRadius: 12,
          padding: '14px 16px',
          border: '1px solid #F5D99A',
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#B7770D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ClipboardList size={14} strokeWidth={1.8} color="#B7770D" /> 지원 시 공개 정책
          </div>
          <p style={{ fontSize: 12, color: '#8B6914', lineHeight: 1.6, margin: 0 }}>
            비공개로 설정한 항목도 공고에 지원할 때는
            채용 담당자에게 <strong>모든 정보가 공개</strong>됩니다.
            이력사항과 첨부파일을 충실히 작성해두면
            채용 가능성이 높아져요!
          </p>
        </div>

      </div>
    </div>
  );
}
