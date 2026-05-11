'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';

const PROMO_CATEGORIES = [
  { value: 'PROMO_CONCERT', label: '공연/연주회 홍보' },
  { value: 'PROMO_SPACE', label: '연습실/공연장 대여' },
];

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구',
  '광주', '대전', '울산', '세종', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
];

export default function WritePromoPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [form, setForm] = useState({
    category: 'PROMO_CONCERT',
    title: '',
    content: '',
    region: '',
    payText: '',
    date: '',
    venue: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('제목을 입력해주세요');
    if (!form.content.trim()) return alert('내용을 입력해주세요');
    setSaving(true);
    try {
      await api.post('/posts', {
        category: form.category,
        title: form.title,
        content: `${form.date ? `[일시] ${form.date}\n` : ''}${form.venue ? `[장소] ${form.venue}\n` : ''}${form.content}`,
        region: form.region,
        payText: form.payText || undefined,
        payType: 'NEGOTIABLE',
        payMin: 0,
      });
      router.replace('/promo');
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
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>공연/연습실 등록</h1>
        <button
          onClick={handleSubmit}
          disabled={saving}
          style={{
            marginLeft: 'auto', padding: '8px 18px',
            background: saving ? '#ccc' : '#7B82BE',
            color: 'white', border: 'none',
            borderRadius: 99, fontSize: 14,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
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
            {PROMO_CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(p => ({ ...p, category: c.value }))}
                style={{
                  padding: '8px 14px', borderRadius: 99,
                  border: `1.5px solid ${form.category === c.value ? '#7B82BE' : '#DDD9EF'}`,
                  background: form.category === c.value ? '#ECEAF8' : 'white',
                  color: form.category === c.value ? '#5A63A8' : '#666',
                  fontSize: 13, fontWeight: form.category === c.value ? 700 : 400,
                  cursor: 'pointer',
                }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            제목 <span style={{ color: '#7B82BE' }}>*</span>
          </label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="공연명 또는 공간명을 입력해주세요"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 날짜/시간 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            날짜/시간
          </label>
          <input
            value={form.date}
            onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            placeholder="예) 2026년 6월 1일 오후 7시"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 장소 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            장소
          </label>
          <input
            value={form.venue}
            onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
            placeholder="예) 예술의전당 리사이틀홀"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 지역 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            지역
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
            대여료/입장료
          </label>
          <input
            value={form.payText}
            onChange={e => setForm(p => ({ ...p, payText: e.target.value }))}
            placeholder="예) 시간당 2만원 / 무료 / 협의"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 내용 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            상세 내용 <span style={{ color: '#7B82BE' }}>*</span>
          </label>
          <textarea
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder={'공연/대여 상세 내용을 입력해주세요\n예) 프로그램, 출연진, 예매 방법 등'}
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
