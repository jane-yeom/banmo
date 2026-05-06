'use client';

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useCreatePost } from '@/hooks/usePosts';
import { useAuthStore } from '@/store/auth.store';
import { uploadImage } from '@/lib/upload';

const MIN_HOURLY = 10030;
const MAX_IMAGES = 5;
const DRAFT_KEY = 'job_write_draft';

const schema = z.object({
  title: z.string().min(2, '제목을 입력하세요').max(100),
  content: z.string().min(10, '내용을 10자 이상 입력하세요'),
  category: z.string().min(1, '카테고리를 선택하세요'),
  province: z.string().optional(),
  district: z.string().optional(),
  payType: z.enum(['HOURLY', 'PER_SESSION', 'MONTHLY', 'NEGOTIABLE']),
  payMin: z.number().min(0),
  payMax: z.number().min(0).optional(),
});
type FormData = z.infer<typeof schema>;

const CATEGORIES = [
  { value: 'JOB_OFFER',        label: '반주자 구인' },
  { value: 'JOB_SEEK',         label: '반주자 구직' },
  { value: 'LESSON_OFFER',     label: '레슨 구인' },
  { value: 'LESSON_SEEK',      label: '레슨 구직' },
  { value: 'PERFORMANCE',      label: '공연 도우미' },
  { value: 'AFTERSCHOOL',      label: '방과후 교사' },
  { value: 'PROMO_CONCERT',    label: '공연 홍보' },
  { value: 'PROMO_SPACE',      label: '연습실 대여' },
  { value: 'TRADE_LESSON',     label: '레슨 양도' },
  { value: 'TRADE_SPACE',      label: '연습실 양도' },
  { value: 'TRADE_TICKET',     label: '티켓 양도' },
  { value: 'TRADE_INSTRUMENT', label: '중고 악기' },
];

const INSTRUMENTS_LIST = [
  '피아노', '바이올린', '비올라', '첼로', '콘트라베이스',
  '플루트', '오보에', '클라리넷', '바순', '호른',
  '트럼펫', '트롬본', '타악기', '기타', '하프',
];

const REGIONS: Record<string, string[]> = {
  서울: ['강남구', '강동구', '강북구', '강서구', '관악구', '광진구', '구로구', '금천구', '노원구', '도봉구', '동대문구', '동작구', '마포구', '서대문구', '서초구', '성동구', '성북구', '송파구', '양천구', '영등포구', '용산구', '은평구', '종로구', '중구', '중랑구'],
  경기: ['수원시', '성남시', '의정부시', '안양시', '부천시', '광명시', '평택시', '동두천시', '안산시', '고양시', '과천시', '구리시', '남양주시', '오산시', '시흥시', '군포시', '의왕시', '하남시', '용인시', '파주시', '이천시', '안성시', '김포시', '화성시', '광주시', '양주시', '포천시', '여주시'],
  인천: ['중구', '동구', '미추홀구', '연수구', '남동구', '부평구', '계양구', '서구', '강화군', '옹진군'],
  부산: ['중구', '서구', '동구', '영도구', '부산진구', '동래구', '남구', '북구', '해운대구', '사하구', '금정구', '강서구', '연제구', '수영구', '사상구', '기장군'],
  대구: ['중구', '동구', '서구', '남구', '북구', '수성구', '달서구', '달성군'],
  광주: ['동구', '서구', '남구', '북구', '광산구'],
  대전: ['동구', '중구', '서구', '유성구', '대덕구'],
  울산: ['중구', '남구', '동구', '북구', '울주군'],
  세종: ['세종시'],
  강원: ['춘천시', '원주시', '강릉시', '동해시', '태백시', '속초시', '삼척시', '홍천군', '횡성군', '영월군', '평창군', '정선군', '철원군', '화천군', '양구군', '인제군', '고성군', '양양군'],
  충북: ['청주시', '충주시', '제천시', '보은군', '옥천군', '영동군', '증평군', '진천군', '괴산군', '음성군', '단양군'],
  충남: ['천안시', '공주시', '보령시', '아산시', '서산시', '논산시', '계룡시', '당진시', '금산군', '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'],
  전북: ['전주시', '군산시', '익산시', '정읍시', '남원시', '김제시', '완주군', '진안군', '무주군', '장수군', '임실군', '순창군', '고창군', '부안군'],
  전남: ['목포시', '여수시', '순천시', '나주시', '광양시', '담양군', '곡성군', '구례군', '고흥군', '보성군', '화순군', '장흥군', '강진군', '해남군', '영암군', '무안군', '함평군', '영광군', '장성군', '완도군', '진도군', '신안군'],
  경북: ['포항시', '경주시', '김천시', '안동시', '구미시', '영주시', '영천시', '상주시', '문경시', '경산시', '군위군', '의성군', '청송군', '영양군', '영덕군', '청도군', '고령군', '성주군', '칠곡군', '예천군', '봉화군', '울진군', '울릉군'],
  경남: ['창원시', '진주시', '통영시', '사천시', '김해시', '밀양시', '거제시', '양산시', '의령군', '함안군', '창녕군', '고성군', '남해군', '하동군', '산청군', '함양군', '거창군', '합천군'],
  제주: ['제주시', '서귀포시'],
};


export default function JobWritePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const createPost = useCreatePost();
  const [mounted, setMounted] = useState(false);
  const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { payType: 'NEGOTIABLE', payMin: 0 },
  });

  const payType = watch('payType');
  const payMin = watch('payMin');
  const province = watch('province');
  const isLowPay = payType === 'HOURLY' && payMin > 0 && payMin < MIN_HOURLY;
  const districts = province ? REGIONS[province] ?? [] : [];

  // 마운트 + 로그인 체크
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !user) router.replace('/login');
  }, [mounted, user, router]);

  // 임시저장 로드
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (!draft) return;
      const parsed = JSON.parse(draft);
      reset(parsed.form);
      setSelectedInstruments(parsed.instruments ?? []);
      setImageUrls(parsed.imageUrls ?? []);
    } catch { /* ignore */ }
  }, [reset]);

  // 임시저장
  const saveDraft = () => {
    const form = watch();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, instruments: selectedInstruments, imageUrls }));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  const toggleInstrument = (inst: string) => {
    setSelectedInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst],
    );
  };

  const handleImageFiles = async (files: File[]) => {
    const remaining = MAX_IMAGES - imageUrls.length;
    const toUpload = files.slice(0, remaining);
    if (toUpload.length === 0) { alert(`이미지는 최대 ${MAX_IMAGES}장까지 첨부 가능합니다.`); return; }
    setImageUploading(true);
    try {
      const uploaded = await Promise.all(toUpload.map(uploadImage));
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch { alert('이미지 업로드에 실패했습니다.'); }
    finally { setImageUploading(false); }
  };

  const onSubmit = async (data: FormData) => {
    const region = data.district || data.province || '';
    const payload = {
      title: data.title,
      content: data.content,
      category: data.category as any,
      region,
      payType: data.payType,
      payMin: data.payMin,
      payMax: data.payMax,
      instruments: selectedInstruments,
      imageUrls,
    };
    console.log('[Write] 제출 데이터:', payload);
    try {
      const newPost = await createPost.mutateAsync(payload as any);
      localStorage.removeItem(DRAFT_KEY);
      toast.success('공고가 등록되었습니다');
      router.push(`/jobs/${newPost.id}`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || '오류가 발생했습니다. 다시 시도해주세요';
      console.error('[에러]', error?.response?.data);
      toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  if (!mounted || !user) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">공고 작성</h1>
        <button
          type="button"
          onClick={saveDraft}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {draftSaved ? '✓ 저장됨' : '임시저장'}
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 카테고리 */}
        <Field label="카테고리" error={errors.category?.message}>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((cat) => (
              <label key={cat.value} className="cursor-pointer">
                <input type="radio" value={cat.value} {...register('category')} className="sr-only peer" />
                <span className="block rounded-lg border border-gray-200 px-2 py-2 text-center text-xs peer-checked:border-violet-700 peer-checked:bg-violet-50 peer-checked:text-violet-700 peer-checked:font-semibold transition-colors">
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </Field>

        {/* 제목 */}
        <Field label="공고 제목" error={errors.title?.message}>
          <input
            {...register('title')}
            placeholder="예) [급구] 주일예배 반주자 구합니다"
            className="input-base"
          />
        </Field>

        {/* 악기 */}
        <Field label="악기">
          <div className="flex flex-wrap gap-2">
            {INSTRUMENTS_LIST.map((inst) => (
              <button
                key={inst}
                type="button"
                onClick={() => toggleInstrument(inst)}
                className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                  selectedInstruments.includes(inst)
                    ? 'border-violet-700 bg-violet-700 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-violet-400'
                }`}
              >
                {inst}
              </button>
            ))}
          </div>
        </Field>

        {/* 지역 (2단계) */}
        <Field label="지역" error={errors.province?.message}>
          <div className="flex gap-2">
            <select
              {...register('province')}
              onChange={(e) => { setValue('province', e.target.value); setValue('district', ''); }}
              className="input-base flex-1"
            >
              <option value="">시/도 선택</option>
              {Object.keys(REGIONS).map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              {...register('district')}
              disabled={!province}
              className="input-base flex-1 disabled:opacity-40"
            >
              <option value="">시/군/구 선택</option>
              {districts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </Field>

        {/* 페이 */}
        <Field label="급여 조건" error={errors.payMin?.message}>
          <div className="flex gap-2 mb-3">
            {(['NEGOTIABLE', 'HOURLY', 'PER_SESSION', 'MONTHLY'] as const).map((type) => (
              <label key={type} className="cursor-pointer flex-1">
                <input type="radio" value={type} {...register('payType')} className="sr-only peer" />
                <span className="block rounded-lg border border-gray-200 py-2 text-center text-xs peer-checked:border-violet-700 peer-checked:bg-violet-50 peer-checked:text-violet-700 peer-checked:font-semibold transition-colors">
                  {type === 'NEGOTIABLE' ? '협의' : type === 'HOURLY' ? '시급' : type === 'PER_SESSION' ? '회당' : '월급'}
                </span>
              </label>
            ))}
          </div>
          {payType !== 'NEGOTIABLE' && (
            <div className="space-y-2">
              <input
                {...register('payMin', { valueAsNumber: true })}
                type="number"
                placeholder="최소 금액 (원)"
                className={`input-base ${isLowPay ? 'border-red-400 bg-red-50' : ''}`}
              />
              {isLowPay && (
                <p className="text-xs text-red-500">
                  ⚠️ 2024년 최저시급({MIN_HOURLY.toLocaleString()}원) 미만입니다.
                </p>
              )}
              <input
                {...register('payMax', { valueAsNumber: true })}
                type="number"
                placeholder="최대 금액 (원, 선택)"
                className="input-base"
              />
            </div>
          )}
        </Field>

        {/* 상세 내용 */}
        <Field label="상세 내용" error={errors.content?.message}>
          <textarea
            {...register('content')}
            rows={8}
            placeholder="공고 상세 내용을 입력하세요..."
            className="input-base resize-none"
          />
        </Field>

        {/* 이미지 첨부 */}
        <Field label={`이미지 첨부 (${imageUrls.length}/${MAX_IMAGES})`}>
          <div className="space-y-2">
            {imageUrls.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-gray-200">
                      <Image src={url} alt={`첨부 ${i + 1}`} fill className="object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {imageUrls.length < MAX_IMAGES && (
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                disabled={imageUploading}
                className="flex items-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm text-gray-500 hover:border-violet-300 hover:text-violet-600 transition-colors disabled:opacity-50"
              >
                {imageUploading ? '업로드 중...' : '+ 이미지 추가 (jpg, png, webp · 최대 10MB)'}
              </button>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const files = Array.from(e.target.files ?? []);
                handleImageFiles(files);
                e.target.value = '';
              }}
            />
          </div>
        </Field>

        <button
          type="submit"
          disabled={createPost.isPending || imageUploading}
          className="w-full rounded-xl bg-violet-700 py-4 text-base font-semibold text-white hover:bg-violet-800 transition-colors disabled:opacity-60"
        >
          {createPost.isPending ? '등록 중...' : '공고 등록'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
