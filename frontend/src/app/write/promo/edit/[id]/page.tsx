'use client'
import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import api from '@/lib/axios'
import { uploadImage } from '@/lib/upload'
import SubHeader from '@/components/layout/SubHeader'
import { Camera, X, MapPin, Coins, Calendar } from 'lucide-react'

const PROMO_CATEGORIES = [
  { value: 'PROMO_CONCERT', label: '공연/연주회' },
  { value: 'PROMO_SPACE',   label: '연습실' },
  { value: 'PROMO_CONTEST', label: '콩쿨' },
]

const REGIONS = [
  '서울', '경기', '인천', '부산', '대구',
  '광주', '대전', '울산', '세종', '강원',
  '충북', '충남', '전북', '전남', '경북', '경남', '제주',
]

function PromoEditContent() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const { isLoggedIn } = useAuthStore()

  const [form, setForm] = useState({
    category: 'PROMO_CONCERT',
    title: '',
    content: '',
    region: '',
    payText: '',
    date: '',
    venue: '',
  })
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isLoggedIn) { router.replace('/login'); return; }
    const fetchPost = async () => {
      try {
        const res = await api.get(`/posts/${id}`)
        const post = res.data?.data || res.data
        setForm({
          category: post.category || 'PROMO_CONCERT',
          title: post.title || '',
          content: post.content || '',
          region: post.region || '',
          payText: post.payText || '',
          date: post.date || '',
          venue: post.venue || '',
        })
        setImages(post.imageUrls || [])
      } catch {
        alert('공고를 불러올 수 없습니다')
        router.back()
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id, isLoggedIn, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (images.length + files.length > 5) {
      alert('이미지는 최대 5장까지 첨부 가능합니다')
      return
    }
    setUploading(true)
    try {
      const urls = await Promise.all(files.map(f => uploadImage(f)))
      setImages(prev => [...prev, ...urls])
    } catch {
      alert('이미지 업로드 실패')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!form.title.trim()) return alert('제목을 입력해주세요')
    if (!form.content.trim()) return alert('내용을 입력해주세요')
    setSaving(true)
    try {
      await api.patch(`/posts/${id}`, { ...form, imageUrls: images })
      router.replace(`/promo/${id}`)
    } catch (e: any) {
      alert(e.response?.data?.message || '수정 실패')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      로딩 중...
    </div>
  )

  const isSpace = form.category === 'PROMO_SPACE'

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      <SubHeader
        title={isSpace ? '연습실/공연장 수정' : '공연/연주회 수정'}
        rightElement={
          <button onClick={handleSubmit} disabled={saving} style={{
            padding: '8px 18px',
            background: saving ? '#ccc' : '#1C1C1C',
            color: 'white', border: 'none',
            borderRadius: 8, fontSize: 14,
            fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
          }}>
            {saving ? '저장 중...' : '저장'}
          </button>
        }
      />

      <div style={{ padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 22 }}>

        {/* 카테고리 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 10 }}>
            카테고리
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            {PROMO_CATEGORIES.map(c => (
              <button key={c.value}
                onClick={() => setForm(p => ({ ...p, category: c.value }))}
                style={{
                  flex: 1, padding: '10px',
                  borderRadius: 10,
                  border: `1.5px solid ${form.category === c.value ? '#1C1C1C' : '#E8E4DC'}`,
                  background: form.category === c.value ? '#1C1C1C' : 'white',
                  color: form.category === c.value ? 'white' : '#666',
                  fontSize: 13,
                  fontWeight: form.category === c.value ? 700 : 400,
                  cursor: 'pointer',
                }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* 이미지 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>
            {isSpace ? '연습실/공연장 사진' : '공연 포스터 / 홍보 이미지'}
            <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 400, marginLeft: 6 }}>최대 5장</span>
          </label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {images.map((url, i) => (
              <div key={i} style={{ position: 'relative', width: 90, height: 90 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`이미지${i + 1}`} style={{
                  width: 90, height: 90, borderRadius: 10,
                  objectFit: 'cover', border: '1px solid #E8E4DC',
                }} />
                {i === 0 && (
                  <div style={{
                    position: 'absolute', bottom: 4, left: 4,
                    background: '#1C1C1C', color: 'white',
                    fontSize: 9, fontWeight: 700,
                    padding: '2px 6px', borderRadius: 4,
                  }}>대표</div>
                )}
                <button onClick={() => removeImage(i)} style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20,
                  background: '#EF4444', border: '2px solid white',
                  borderRadius: '50%', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: 0,
                }}>
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
                {uploading
                  ? <span style={{ fontSize: 11, color: '#9CA3AF' }}>업로드중</span>
                  : <><Camera size={22} strokeWidth={1.5} color="#9CA3AF" /><span style={{ fontSize: 10, color: '#9CA3AF' }}>사진 추가</span></>
                }
                <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            )}
          </div>
        </div>

        {/* 제목 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>제목 *</label>
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
            placeholder={isSpace ? '예) 강남 그랜드 피아노 연습실 시간당 대여' : '예) 5월 봄 피아노 독주회'}
            maxLength={50}
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E8E4DC', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* 날짜 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Calendar size={14} strokeWidth={1.8} color="#1C1C1C" />
            {isSpace ? '대여 가능 시간' : '공연 일시'}
          </label>
          <input value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
            placeholder={isSpace ? '예) 평일 오전 9시 ~ 오후 10시' : '예) 2026년 6월 1일 오후 7시 30분'}
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E8E4DC', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* 장소 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <MapPin size={14} strokeWidth={1.8} color="#1C1C1C" />
            {isSpace ? '주소' : '공연 장소'}
          </label>
          <input value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))}
            placeholder={isSpace ? '예) 서울 강남구 테헤란로 OO빌딩 3층' : '예) 예술의전당 리사이틀홀'}
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E8E4DC', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* 지역 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <MapPin size={14} strokeWidth={1.8} color="#1C1C1C" />
            지역
          </label>
          <select value={form.region} onChange={e => setForm(p => ({ ...p, region: e.target.value }))}
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E8E4DC', borderRadius: 10, fontSize: 15, background: 'white', outline: 'none', boxSizing: 'border-box' }}>
            <option value="">지역 선택</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* 가격 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
            <Coins size={14} strokeWidth={1.8} color="#1C1C1C" />
            {isSpace ? '대여료' : '입장료'}
          </label>
          <input value={form.payText} onChange={e => setForm(p => ({ ...p, payText: e.target.value }))}
            placeholder={isSpace ? '예) 시간당 15,000원' : '예) 무료 입장 / 20,000원'}
            maxLength={50}
            style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #E8E4DC', borderRadius: 10, fontSize: 15, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* 내용 */}
        <div>
          <label style={{ fontSize: 13, fontWeight: 700, color: '#444', display: 'block', marginBottom: 8 }}>상세 내용 *</label>
          <textarea value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
            placeholder={isSpace ? '시설 안내, 예약 방법 등을 입력해주세요' : '프로그램, 예매 방법 등을 입력해주세요'}
            rows={8}
            style={{ width: '100%', padding: '14px', border: '1.5px solid #E8E4DC', borderRadius: 10, fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', lineHeight: 1.8, minHeight: 180 }}
          />
        </div>
      </div>
    </div>
  )
}

export default function PromoEditPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
      <PromoEditContent />
    </Suspense>
  )
}
