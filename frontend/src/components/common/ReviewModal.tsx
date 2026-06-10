'use client'
import { useState } from 'react'
import { X, Star } from 'lucide-react'
import apiClient from '@/lib/axios'
import toast from 'react-hot-toast'

interface ReviewModalProps {
  revieweeId: string
  revieweeName: string
  postId?: string
  onClose: () => void
  onSuccess?: () => void
}

export default function ReviewModal({ revieweeId, revieweeName, postId, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) { toast.error('별점을 선택해주세요'); return }
    setLoading(true)
    try {
      await apiClient.post('/reviews', { revieweeId, postId, rating, content: content.trim() || undefined, isPublic })
      toast.success('후기가 등록되었습니다')
      onSuccess?.()
      onClose()
    } catch (e: any) {
      toast.error(e.response?.data?.message || '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: '#F7F4ED',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>후기 남기기</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={22} color="#555" />
          </button>
        </div>

        <p style={{ fontSize: 14, color: '#555', marginBottom: 20 }}>
          <b>{revieweeName}</b>님과의 매칭은 어떠셨나요?
        </p>

        {/* 별점 */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <Star
                size={36}
                fill={(hovered || rating) >= n ? '#FBBF24' : 'none'}
                color={(hovered || rating) >= n ? '#FBBF24' : '#D1D5DB'}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 16 }}>
          {rating === 0 ? '별점을 선택해주세요'
            : rating === 1 ? '매우 불만족'
            : rating === 2 ? '불만족'
            : rating === 3 ? '보통'
            : rating === 4 ? '만족'
            : '매우 만족'}
        </p>

        {/* 후기 내용 */}
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="후기를 자유롭게 작성해주세요 (선택)"
          maxLength={300}
          style={{
            width: '100%', minHeight: 100,
            border: '1px solid #E8E4DC',
            borderRadius: 12, padding: '12px 14px',
            fontSize: 14, resize: 'none',
            background: 'white', boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <div style={{ textAlign: 'right', fontSize: 11, color: '#9CA3AF', marginBottom: 16 }}>
          {content.length}/300
        </div>

        {/* 공개 여부 */}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={e => setIsPublic(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <span style={{ fontSize: 13, color: '#555' }}>후기를 공개로 설정</span>
        </label>

        <button
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          style={{
            width: '100%', padding: '14px',
            background: rating === 0 ? '#E5E7EB' : '#1C1C1C',
            color: rating === 0 ? '#9CA3AF' : 'white',
            border: 'none', borderRadius: 12,
            fontSize: 15, fontWeight: 700,
            cursor: rating === 0 ? 'not-allowed' : 'pointer',
          }}>
          {loading ? '등록 중...' : '후기 등록'}
        </button>
      </div>
    </div>
  )
}
