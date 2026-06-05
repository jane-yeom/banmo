'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import api from '@/lib/axios';
import SubHeader from '@/components/layout/SubHeader';
import { Info, Calendar } from 'lucide-react';

const DRAFT_KEY = 'draft_jobs';

const JOB_CATEGORIES = [
  { value: 'JOB_OFFER', label: '반주자 구인' },
  { value: 'JOB_SEEK', label: '반주자 구직' },
  { value: 'LESSON_OFFER', label: '레슨 구인' },
  { value: 'LESSON_SEEK', label: '레슨 구직' },
  { value: 'PERFORMANCE', label: '공연도우미 구인' },
  { value: 'AFTERSCHOOL', label: '방과후 교사 구인' },
  { value: 'ETC', label: '기타' },
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

const CATEGORY_GUIDE: Record<string, string> = {
  JOB_OFFER: '반주자/연주자를 구하는 공고예요. 레퍼토리, 일정, 연습 횟수를 상세히 적어주세요.',
  JOB_SEEK: '반주/연주 활동을 원하는 구직 공고예요. 경력, 가능한 악기, 활동 가능 지역을 적어주세요.',
  LESSON_OFFER: '레슨 선생님을 구하는 공고예요. 수준, 희망 횟수, 방문/화상 여부를 적어주세요.',
  LESSON_SEEK: '레슨 가능하다는 공고예요. 전공, 경력, 가능한 수준을 적어주세요.',
  PERFORMANCE: '공연 도우미를 구하는 공고예요. 공연 날짜, 장소, 역할을 적어주세요.',
  AFTERSCHOOL: '방과후 교사를 구하는 공고예요. 학교 위치, 수업 시간, 대상 학년을 적어주세요.',
  ETC: '기타 음악 관련 공고예요. 내용을 상세히 작성해주세요.',
};

const CATEGORY_PLACEHOLDER: Record<string, string> = {
  JOB_OFFER: '예) 매주 화/목 오전 10시 성악 레슨 반주입니다.\n레퍼토리: 이탈리아 가곡, 독일 가곡\n연습 3회 + 본 연주 1회 예정입니다.',
  JOB_SEEK: '예) 음대 피아노과 졸업 후 반주 활동 중입니다.\n성악, 기악 반주 모두 가능합니다.\n강남/서초 지역 선호합니다.',
  LESSON_OFFER: '예) 초등학생 피아노 레슨 선생님을 구합니다.\n바이엘 수준이며 주 2회 방문 레슨 원합니다.',
  LESSON_SEEK: '예) 음대 출신으로 피아노 레슨 가능합니다.\n초급~중급 지도 가능하며 콩쿠르 준비 경험 있습니다.',
  PERFORMANCE: '예) 결혼식 피아노 연주자를 구합니다.\n날짜: 2026년 6월 15일 오후 2시\n장소: 서울 강남구 OO웨딩홀',
  AFTERSCHOOL: '예) 초등학교 방과후 바이올린 강사를 구합니다.\n월~금 오후 2-4시, 학교 내 악기 구비되어 있습니다.',
  ETC: '예) 음악 관련 기타 공고입니다.\n자세한 내용을 입력해주세요.',
};

const VALID_JOB_CATEGORIES = JOB_CATEGORIES.map(c => c.value);

function WriteJobsContent() {
  const router = useRouter();
  const { isLoggedIn } = useAuthStore();
  const searchParams = useSearchParams();
  const rawCategory = searchParams.get('category') ?? 'JOB_OFFER';
  const initialCategory = VALID_JOB_CATEGORIES.includes(rawCategory) ? rawCategory : 'JOB_OFFER';

  type FormState = { category: string; title: string; content: string; instruments: string[]; region: string; payText: string };
  const [form, setForm] = useState<FormState>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return { ...parsed, category: initialCategory };
        }
      } catch {}
    }
    return {
      category: initialCategory,
      title: '',
      content: '',
      instruments: [] as string[],
      region: '',
      payText: '',
    };
  });
  const [saving, setSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 초안 자동저장 (2초 디바운스)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 2000);
      } catch {}
    }, 2000);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [form]);

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
      localStorage.removeItem(DRAFT_KEY);
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

  const guide = CATEGORY_GUIDE[form.category];
  const placeholder = CATEGORY_PLACEHOLDER[form.category] ?? '공고 내용을 자세히 입력해주세요';

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      <SubHeader
        title="구인구직 작성"
        rightElement={
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {draftSaved && <span style={{ fontSize: 11, color: '#9CA3AF' }}>초안 저장됨</span>}
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{
                padding: '8px 18px',
                background: saving ? '#ccc' : '#1C1C1C',
                color: 'white', border: 'none',
                borderRadius: 99, fontSize: 14,
                fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
              }}>
              {saving ? '등록 중...' : '등록'}
            </button>
          </div>
        }
      />

      <div style={{ padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* 카테고리 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 10 }}>
            카테고리 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {JOB_CATEGORIES.map(c => (
              <button key={c.value} onClick={() => setForm(p => ({ ...p, category: c.value }))}
                style={{
                  padding: '8px 14px', borderRadius: 99,
                  border: `1.5px solid ${form.category === c.value ? '#1C1C1C' : '#E8E4DC'}`,
                  background: form.category === c.value ? '#F0EDE6' : 'white',
                  color: form.category === c.value ? '#000000' : '#666',
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
              background: '#F7F4ED', borderRadius: 8,
              fontSize: 12, color: '#6B7280', lineHeight: 1.5,
              borderLeft: '3px solid #1C1C1C',
              display: 'flex', alignItems: 'flex-start', gap: 6,
            }}>
              <Info size={13} strokeWidth={1.8} color="#9CA3AF" style={{ flexShrink: 0, marginTop: 1 }} />
              {guide}
            </div>
          )}
        </div>

        {/* 제목 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            제목 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <input
            value={form.title}
            onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder="공고 제목을 입력해주세요"
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
                  border: `1.5px solid ${form.instruments.includes(inst) ? '#1C1C1C' : '#E8E4DC'}`,
                  background: form.instruments.includes(inst) ? '#F0EDE6' : 'white',
                  color: form.instruments.includes(inst) ? '#000000' : '#666',
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
              border: '1.5px solid #E8E4DC', borderRadius: 12,
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
            페이 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <input
            value={form.payText}
            onChange={e => setForm(p => ({ ...p, payText: e.target.value }))}
            placeholder="예) 시급 15,000원 / 회당 8만원 / 협의 가능"
            maxLength={50}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Info size={12} strokeWidth={1.8} /> 시급 기준 최저임금(10,030원) 이상으로 입력해주세요
          </p>
        </div>

        {/* 자동 마감 안내 */}
        <div style={{
          padding: '10px 14px', background: '#FFF7ED',
          border: '1px solid #FED7AA', borderRadius: 10,
          fontSize: 12, color: '#92400E', lineHeight: 1.5,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <Calendar size={13} strokeWidth={1.8} color="#92400E" style={{ flexShrink: 0 }} />
          공고는 등록 후 <strong>30일</strong>이 지나면 자동으로 마감됩니다.
        </div>

        {/* 내용 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            상세 내용 <span style={{ color: '#1C1C1C' }}>*</span>
          </label>
          <textarea
            value={form.content}
            onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder={placeholder}
            rows={8}
            style={{
              width: '100%', padding: '12px 14px',
              border: '1.5px solid #E8E4DC', borderRadius: 12,
              fontSize: 15, outline: 'none',
              resize: 'none', boxSizing: 'border-box',
              lineHeight: 1.6,
            }}
          />
          <div style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
            {form.content.length}자
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WriteJobsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: '#9CA3AF' }}>로딩 중...</div>}>
      <WriteJobsContent />
    </Suspense>
  );
}
