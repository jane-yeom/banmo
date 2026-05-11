'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';

const JOB_CATEGORIES = [
  { value: 'JOB_OFFER', label: '반주자 구인' },
  { value: 'JOB_SEEK', label: '반주자 구직' },
  { value: 'LESSON_OFFER', label: '레슨 구인' },
  { value: 'LESSON_SEEK', label: '레슨 구직' },
  { value: 'PERFORMANCE', label: '공연도우미 구인' },
  { value: 'AFTERSCHOOL', label: '방과후 교사 구인' },
];

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

export default function WriteJobsPage() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const [form, setForm] = useState({
    category: 'JOB_OFFER',
    title: '',
    content: '',
    instruments: [] as string[],
    region: '',
    payText: '',
  });
  const [saving, setSaving] = useState(false);

  const toggleInstrument = (inst: string) => {
    setForm(prev => ({
      ...prev,
      instruments: prev.instruments.includes(inst)
        ? prev.instruments.filter(i => i !== inst)
        : [...prev.instruments, inst],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('제목을 입력해주세요');
    if (!form.content.trim()) return alert('내용을 입력해주세요');
    if (!form.payText.trim()) return alert('페이를 입력해주세요');
    setSaving(true);
    try {
      const res = await api.post('/posts', {
        ...form,
        payType: 'NEGOTIABLE',
        payMin: 0,
      });
      const id = res.data?.id || res.data?.data?.id;
      router.replace(`/jobs/${id}`);
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
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>구인구직 공고 작성</h1>
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
            {JOB_CATEGORIES.map(c => (
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
            placeholder="공고 제목을 입력해주세요"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 악기 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 10 }}>
            악기 선택
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INSTRUMENTS.map(inst => (
              <button key={inst} onClick={() => toggleInstrument(inst)}
                style={{
                  padding: '7px 12px', borderRadius: 99,
                  border: `1.5px solid ${form.instruments.includes(inst) ? '#7B82BE' : '#DDD9EF'}`,
                  background: form.instruments.includes(inst) ? '#ECEAF8' : 'white',
                  color: form.instruments.includes(inst) ? '#5A63A8' : '#666',
                  fontSize: 13, fontWeight: form.instruments.includes(inst) ? 700 : 400,
                  cursor: 'pointer',
                }}>
                {inst}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            활동 지역
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

        {/* 페이 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            페이 <span style={{ color: '#7B82BE' }}>*</span>
          </label>
          <input
            value={form.payText}
            onChange={e => setForm(p => ({ ...p, payText: e.target.value }))}
            placeholder="예) 시급 15,000원 / 회당 8만원 / 협의 가능"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #DDD9EF', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6 }}>
            💡 시급 기준 최저임금(10,030원) 이상으로 입력해주세요
          </p>
        </div>

        {/* 내용 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            상세 내용 <span style={{ color: '#7B82BE' }}>*</span>
          </label>
          <textarea
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder={'공고 내용을 자세히 입력해주세요\n예) 레퍼토리, 일정, 연습 횟수, 기타 조건 등'}
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
