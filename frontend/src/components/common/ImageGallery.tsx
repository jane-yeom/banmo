'use client'
import { useState, useRef } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  borderRadius?: number
}

export default function ImageGallery({ images, borderRadius = 14 }: ImageGalleryProps) {
  const [current, setCurrent] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const touchStartX = useRef(0)
  const touchEndX = useRef(0)

  if (!images || images.length === 0) return null

  const prev = () => setCurrent(c => (c - 1 + images.length) % images.length)
  const next = () => setCurrent(c => (c + 1) % images.length)

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX.current
    if (Math.abs(diff) > 50) {
      diff > 0 ? next() : prev()
    }
  }

  return (
    <>
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16/9',
          borderRadius,
          overflow: 'hidden',
          background: '#F7F4ED',
          marginBottom: 8,
          cursor: 'pointer',
        }}
        onClick={() => setFullscreen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[current]}
          alt={`이미지 ${current + 1}`}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'opacity 0.2s' }}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              style={{
                position: 'absolute', left: 8, top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.4)',
                border: 'none', borderRadius: '50%',
                width: 32, height: 32,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}>
              <ChevronLeft size={18} color="white" strokeWidth={2} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              style={{
                position: 'absolute', right: 8, top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.4)',
                border: 'none', borderRadius: '50%',
                width: 32, height: 32,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}>
              <ChevronRight size={18} color="white" strokeWidth={2} />
            </button>
          </>
        )}

        {images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, right: 12,
            background: 'rgba(0,0,0,0.5)',
            color: 'white', fontSize: 11, fontWeight: 600,
            padding: '3px 8px', borderRadius: 99,
          }}>
            {current + 1} / {images.length}
          </div>
        )}

        {images.length > 1 && (
          <div style={{
            position: 'absolute', bottom: 10, left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex', gap: 5,
          }}>
            {images.map((_, i) => (
              <div
                key={i}
                onClick={e => { e.stopPropagation(); setCurrent(i) }}
                style={{
                  width: i === current ? 16 : 6,
                  height: 6, borderRadius: 3,
                  background: i === current ? 'white' : 'rgba(255,255,255,0.5)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div style={{
          display: 'flex', gap: 6,
          overflowX: 'auto', paddingBottom: 4,
          scrollbarWidth: 'none',
        }}>
          {images.map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={url}
              alt={`썸네일 ${i + 1}`}
              onClick={() => setCurrent(i)}
              style={{
                width: 56, height: 56,
                borderRadius: 8,
                objectFit: 'cover',
                flexShrink: 0,
                cursor: 'pointer',
                border: i === current ? '2px solid #1C1C1C' : '1px solid #E8E4DC',
                opacity: i === current ? 1 : 0.7,
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      )}

      {fullscreen && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={e => {
            touchEndX.current = e.changedTouches[0].clientX
            const diff = touchStartX.current - touchEndX.current
            if (Math.abs(diff) > 50) {
              diff > 0 ? next() : prev()
            }
          }}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.95)',
            zIndex: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => setFullscreen(false)}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: '50%',
              width: 40, height: 40,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
              zIndex: 10,
            }}>
            <X size={22} color="white" strokeWidth={2} />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[current]}
            alt="전체화면"
            style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 4 }}
          />

          {images.length > 1 && (
            <>
              <button onClick={prev} style={{
                position: 'absolute', left: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: 44, height: 44,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}>
                <ChevronLeft size={22} color="white" strokeWidth={2} />
              </button>
              <button onClick={next} style={{
                position: 'absolute', right: 12, top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: 44, height: 44,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}>
                <ChevronRight size={22} color="white" strokeWidth={2} />
              </button>
              <div style={{
                position: 'absolute', bottom: 20,
                left: '50%', transform: 'translateX(-50%)',
                color: 'white', fontSize: 13, fontWeight: 600,
              }}>
                {current + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
