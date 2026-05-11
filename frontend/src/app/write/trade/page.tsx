'use client';

import { useState, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, Camera } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import { uploadImage } from '@/lib/upload';

const TRADE_CATEGORIES = [
  { value: 'TRADE_INSTRUMENT', label: '중고악기 거래' },
  { value: 'TRADE_LESSON', label: '레슨 양도' },
  { value: 'TRADE_SPACE', label: '연습실 양도' },
  { value: 'TRADE_TICKET', label: '공연티켓 양도' },
];

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구',
  '광주', '대전', '울산', '세종', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

const CATEGORY_GUIDE: Record<string, string> = {
  TRADE_INSTRUMENT: '중고 악기 거래예요. 브랜드, 연식, 상태를 상세히 적어주세요.',
  TRADE_LESSON: '레슨 양도 정보예요. 선생님 정보, 남은 횟수, 양도 사유를 적어주세요.',
  TRADE_SPACE: '연습실 양도 정보예요. 위치, 계약 기간, 양도 조건을 적어주세요.',
  TRADE_TICKET: '공연 티켓 양도예요. 공연명, 날짜, 좌석 정보를 적어주세요.',
};

const VALID_TRADE_CATEGORIES = TRADE_CATEGORIES.map(c => c.value);

type TradeMethod = 'direct' | 'delivery' | 'both';

const TRADE_METHOD_LABELS: Record<TradeMethod, string> = {
  direct: '직거래',
  delivery: '택배',
  both: '모두 가능',
};

function WriteTradeContent() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category') ?? 'TRADE_INSTRUMENT';
  const initialCategory = VALID_TRADE_CATEGORIES.includes(rawCategory) ? rawCategory : 'TRADE_INSTRUMENT';

  const [form, setForm] = useState({
    category: initialCategory,
    title: '',
    content: '',
    region: '',
    payText: '',
    tradeMethod: 'both' as TradeMethod,
  });
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const remaining = 5 - images.length;
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const uploaded = await Promise.all(toUpload.map(uploadImage));
      setImages(prev => [...prev, ...uploaded]);
    } catch {
      alert('이미지 업로드 실패');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeImage = (i: number) => {
    setImages(prev => prev.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('제목을 입력해주세요');
    if (!form.content.trim()) return alert('내용을 입력해주세요');
    setSaving(true);
    try {
      const res = await api.post('/posts', {
        category: form.category,
        title: form.title,
        content: `[거래방법] ${TRADE_METHOD_LABELS[form.tradeMethod]}\n${form.content}`,
        region: form.region,
        payText: form.payText || undefined,
        payType: 'NEGOTIABLE',
        payMin: 0,
        imageUrls: images,
      });
      const id = res.data?.id || res.data?.data?.id;
      router.replace(`/trade/${id}`);
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

  const guide = CATEGORY_GUIDE[form.category];

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      {/* 헤더 */}
      <div style={{
        position: 'sticky', top: 0, background: 'white',
        borderBottom: '0.5px solid #DDD9EF',
        padding: '12px 16px', display: 'flex',
        alignItems: 'center', gap: 12, zIndex: 10,
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ChevronLeft size={24} color="#7B82BE" strokeWidth={2} />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>양도/중고거래 등록</h1>
        <button
          onClick={handleSubmit}
          disabled={saving || uploading}
          style={{
            marginLeft: 'auto', padding: '8px 18px',
            background: saving || uploading ? '#ccc' : '#7B82BE',
            color: 'white', border: 'none',
            borderRadius: 99, fontSize: 14,
            fontWeight: 700, cursor: saving || uploading ? 'not-allowed' : 'pointer',
          }}>
          {saving ? '등록 중...' : '등록'}
        </button>
      </div>

      <div style={{ padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 카테고리 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 10 }}>
            카테고리 <span style={{ color: '#7B82BE' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TRADE_CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(p => ({ ...p, category: c.value }))}
                style={{
                  padding: '8px 14px', borderRadius: 99,
                  border: `1.5px solid ${form.category === c.value ? '#7B82BE' : '#DDD9EF'}`,
                  background: form.category === c.value ? '#ECEAF8' : 'white',
                  color: form.category === c.value ? '#5A63A8' : '#666',
                  fontSize: 13, fontWeight: form.category === c.value ? 700 : 400,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                {c.label}
              </button>
            ))}
          </div>
          {guide && (
            <div style={{
              marginTop: 10, padding: '10px 12px',
              background: '#F4F3F9', borderRadius: 8,
              fontSize: 12, color: '#6B7280', lineHeight: 1.5,
              borderLeft: '3px solid #7B82BE',
            }}>
              💡 {guide}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            제목 <span style={{ color: '#7B82BE' }}>*</span>
          </label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="상품명을 입력해주세요"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 거래 방법 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 10 }}>
            거래 방법
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['direct', 'delivery', 'both'] as TradeMethod[]).map(m => (
              <button key={m} onClick={() => setForm(p => ({ ...p, tradeMethod: m }))}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 10,
                  border: `1.5px solid ${form.tradeMethod === m ? '#7B82BE' : '#DDD9EF'}`,
                  background: form.tradeMethod === m ? '#ECEAF8' : 'white',
                  color: form.tradeMethod === m ? '#5A63A8' : '#666',
                  fontSize: 13, fontWeight: form.tradeMethod === m ? 700 : 400,
                  cursor: 'pointer',
                }}>
                {TRADE_METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            거래 지역
          </label>
          <select
            value={form.region}
            onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, background: 'white',
              outline: 'none', boxSizing: 'border-box',
            }}>
            <option value="">지역 선택</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* 가격 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            가격
          </label>
          <input
            value={form.payText}
            onChange={e => setForm(p => ({ ...p, payText: e.target.value }))}
            placeholder="예) 50만원 / 가격 협의 / 무료 나눔"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 이미지 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 10 }}>
            사진 첨부 (최대 5장)
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 80, height: 80 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`첨부 ${i + 1}`} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                <button onClick={() => removeImage(i)}
                  style={{
                    position: 'absolute', top: -6, right: -6, width: 20, height: 20,
                    background: '#EF4444', border: 'none', borderRadius: '50%',
                    color: 'white', fontSize: 12, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✕</button>
              </div>
            ))}
            {images.length < 5 && (
              <label style={{
                width: 80, height: 80, border: '1.5px dashed #DDD9EF',
                borderRadius: 8, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                color: '#9CA3AF', fontSize: 11, gap: 4,
              }}>
                <Camera size={24} color="#9CA3AF" />
                <span>{uploading ? '업로드 중' : '사진 추가'}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={handleImageUpload}
                />
              </label>
            )}
          </div>
        </div>

        {/* 내용 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            상세 내용 <span style={{ color: '#7B82BE' }}>*</span>
          </label>
          <textarea
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder={'상품 상세 내용을 입력해주세요\n예) 브랜드, 상태, 사용 기간, 하자 여부 등'}
            rows={8}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none',
              resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function WriteTradeePage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>로딩 중...</div>}>
      <WriteTradeContent />
    </Suspense>
  );
}
