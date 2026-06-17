'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import { uploadImage } from '@/lib/upload';
import SubHeader from '@/components/layout/SubHeader';
import { Camera, X, MapPin, Coins, Calendar, Info } from 'lucide-react';

const PROMO_CATEGORIES = [
  { value: 'PROMO_CONCERT', label: '공연/연주회' },
  { value: 'PROMO_SPACE',   label: '연습실' },
  { value: 'PROMO_CONTEST', label: '콩쿨' },
];

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구',
  '광주', '대전', '울산', '세종', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const VALID_PROMO_CATEGORIES = PROMO_CATEGORIES.map(c => c.value);

function WritePromoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category') ?? 'PROMO_CONCERT';
  const initialCategory = VALID_PROMO_CATEGORIES.includes(rawCategory) ? rawCategory : 'PROMO_CONCERT';
  const { isLoggedIn } = useAuthStore();

  const [form, setForm] = useState({
    category: initialCategory,
    title: '',
    content: '',
    region: '',
    payText: '',
    date: '',
    venue: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 5) {
      alert('이미지는 최대 5장까지 첨부 가능합니다');
      return;
    }
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(f => uploadImage(f)));
      setImages(prev => [...prev, ...urls]);
    } catch {
      alert('이미지 업로드 실패');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('제목을 입력해주세요');
    if (!form.content.trim()) return alert('내용을 입력해주세요');
    setSaving(true);
    try {
      const res = await api.post('/posts', {
        category: form.category,
        title: form.title,
        content: `${form.date ? `[일시] ${form.date}\n` : ''}${form.venue ? `[장소] ${form.venue}\n` : ''}${form.content}`,
        region: form.region,
        payText: form.payText || undefined,
        imageUrls: images,
        payType: 'NEGOTIABLE',
        payMin: 0,
      });
      const id = res.data?.id || res.data?.data?.id;
      router.replace(id ? `/promo/${id}` : '/promo');
    } catch (e: any) {
      alert(e.response?.data?.message || '등록 실패');
    } finally {
      setSaving(false);
    }
  };

  if (!isLoggedIn) {
    router.replace('/login');
    return null;
  }

  const isSpace = form.category === 'PROMO_SPACE';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      <SubHeader
        title={isSpace ? '연습실/공연장 등록' : '공연/연주회 홍보'}
        rightElement={
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '8px 18px',
              background: saving ? '#ccc' : '#1C1C1C',
              color: 'white', border: 'none',
              borderRadius: 99, fontSize: 14,
              fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? '등록 중...' : '등록'}
          </button>
        }
      />

      <div style={{ padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* 카테고리 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 10 }}>
            카테고리 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PROMO_CATEGORIES.map(c => (
              <button
                key={c.value}
                onClick={() => setForm(p => ({ ...p, category: c.value }))}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: 12,
                  border: `1.5px solid ${form.category === c.value ? '#1C1C1C' : '#E8E4DC'}`,
                  background: form.category === c.value ? '#F0EDE6' : 'white',
                  color: form.category === c.value ? '#000000' : '#666',
                  fontSize: 13,
                  fontWeight: form.category === c.value ? 700 : 400,
                  cursor: 'pointer',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 첨부 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            {isSpace ? '연습실/공연장 사진' : '공연 포스터 / 홍보 이미지'}
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>
              최대 5장
            </span>
          </label>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 90, height: 90 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`이미지${i + 1}`}
                  style={{
                    width: 90, height: 90,
                    borderRadius: 10, objectFit: 'cover',
                    border: '1px solid #E8E4DC',
                  }}
                />
                {i === 0 && (
                  <div style={{
                    position: 'absolute', bottom: 4, left: 4,
                    background: '#1C1C1C', color: 'white',
                    fontSize: 9, fontWeight: 700,
                    padding: '2px 6px', borderRadius: 4,
                  }}>
                    대표
                  </div>
                )}
                <button
                  onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 20, height: 20,
                    background: '#EF4444', border: '2px solid white',
                    borderRadius: '50%', cursor: 'pointer',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 0,
                  }}
                >
                  <X size={10} color="white" strokeWidth={3} />
                </button>
              </div>
            ))}

            {images.length < 5 && (
              <label style={{
                width: 90, height: 90,
                border: '1.5px dashed #E8E4DC',
                borderRadius: 10, cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 4, background: '#FAFAFA',
              }}>
                {uploading ? (
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>업로드중</span>
                ) : (
                  <>
                    <Camera size={22} strokeWidth={1.5} color="#9CA3AF" />
                    <span style={{ fontSize: 10, color: '#9CA3AF' }}>
                      {images.length === 0 ? '사진 추가' : `${images.length}/5`}
                    </span>
                  </>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </label>
            )}
          </div>

          <p style={{
            fontSize: 11, color: '#9CA3AF', marginTop: 6,
            display: 'flex', alignItems: 'flex-start', gap: 4,
          }}>
            <Info size={11} strokeWidth={1.8} style={{ flexShrink: 0, marginTop: 1 }} />
            {isSpace
              ? '내부 사진, 피아노/시설 사진을 올려주세요. 첫 번째 사진이 대표 이미지로 표시됩니다.'
              : '공연 포스터나 홍보 이미지를 올려주세요. 첫 번째 사진이 대표 이미지로 표시됩니다.'}
          </p>
        </div>

        {/* 제목 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            제목 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder={isSpace
              ? '예) 강남 그랜드 피아노 연습실 시간당 대여'
              : '예) 5월 봄 피아노 독주회 - 홍길동 피아노 리사이틀'}
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            {form.title.length}/50
          </div>
        </div>

        {/* 날짜/시간 */}
        <div>
          <label style={{
            fontSize: 13, fontWeight: 700, color: '#444',
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8,
          }}>
            <Calendar size={14} strokeWidth={1.8} color="#1C1C1C" />
            {isSpace ? '대여 가능 시간' : '공연 일시'}
          </label>
          <input
            value={form.date}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            placeholder={isSpace
              ? '예) 평일 오전 9시 ~ 오후 10시, 주말 오전 10시 ~ 오후 8시'
              : '예) 2026년 6월 1일 (일) 오후 7시 30분'}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 장소/주소 */}
        <div>
          <label style={{
            fontSize: 13, fontWeight: 700, color: '#444',
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8,
          }}>
            <MapPin size={14} strokeWidth={1.8} color="#1C1C1C" />
            {isSpace ? '주소' : '공연 장소'}
          </label>
          <input
            value={form.venue}
            onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
            placeholder={isSpace
              ? '예) 서울 강남구 테헤란로 OO빌딩 3층'
              : '예) 예술의전당 리사이틀홀'}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 지역 */}
        <div>
          <label style={{
            fontSize: 13, fontWeight: 700, color: '#444',
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8,
          }}>
            <MapPin size={14} strokeWidth={1.8} color="#1C1C1C" />
            지역
          </label>
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

        {/* 가격/입장료 */}
        <div>
          <label style={{
            fontSize: 13, fontWeight: 700, color: '#444',
            display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8,
          }}>
            <Coins size={14} strokeWidth={1.8} color="#1C1C1C" />
            {isSpace ? '대여료' : '입장료'}
          </label>
          <input
            value={form.payText}
            onChange={e => setForm(p => ({ ...p, payText: e.target.value }))}
            placeholder={isSpace
              ? '예) 시간당 15,000원 / 월정액 할인 가능'
              : '예) 무료 입장 / 20,000원 / 전석 매진'}
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 상세 내용 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            상세 내용 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <textarea
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder={isSpace
              ? '예) 스타인웨이 그랜드 피아노 완비\n방음 완벽, 냉난방 완비\n예약 후 이용 가능\n주차 가능 (2시간 무료)\n문의: 카카오채널 또는 채팅'
              : '예) 프로그램\n- 쇼팽 발라드 1번 g단조\n- 리스트 피아노 소나타 b단조\n- 브람스 간주곡 Op.118\n\n예매 및 문의는 채팅으로 연락주세요'}
            rows={8}
            style={{
              width: '100%', padding: '14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 14, outline: 'none',
              resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.8, minHeight: 180,
            }}
          />
        </div>

      </div>
    </div>
  );
}

export default function WritePromoPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>로딩 중...</div>}>
      <WritePromoContent />
    </Suspense>
  );
}
