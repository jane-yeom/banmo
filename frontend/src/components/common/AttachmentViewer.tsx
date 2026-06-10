'use client'
import { useState } from 'react'
import { X, ZoomIn, ZoomOut, FileText } from 'lucide-react'

interface AttachmentViewerProps {
  attachmentUrl: string
  attachmentName: string
  onClose: () => void
}

export default function AttachmentViewer({
  attachmentUrl,
  attachmentName,
  onClose,
}: AttachmentViewerProps) {
  const [zoom, setZoom] = useState(1)
  const isPdf = attachmentName?.toLowerCase().endsWith('.pdf')
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(attachmentName || '')

  const zoomIn = () => setZoom(z => Math.min(z + 0.25, 3))
  const zoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5))

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.95)',
      zIndex: 300,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* 상단 헤더 */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.8)',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          flex: 1, minWidth: 0,
        }}>
          <FileText size={18} color="white" strokeWidth={1.8} />
          <span style={{
            color: 'white', fontSize: 14, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {attachmentName || '첨부파일'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isImage && (
            <>
              <button onClick={zoomOut} style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: 36, height: 36,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}>
                <ZoomOut size={18} color="white" />
              </button>
              <span style={{
                color: 'white', fontSize: 13, minWidth: 40,
                textAlign: 'center',
              }}>
                {Math.round(zoom * 100)}%
              </span>
              <button onClick={zoomIn} style={{
                background: 'rgba(255,255,255,0.15)',
                border: 'none', borderRadius: '50%',
                width: 36, height: 36,
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
              }}>
                <ZoomIn size={18} color="white" />
              </button>
            </>
          )}
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none', borderRadius: '50%',
            width: 36, height: 36,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer',
            marginLeft: 4,
          }}>
            <X size={20} color="white" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 콘텐츠 영역 */}
      <div style={{
        flex: 1, overflow: 'auto',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}>
        {isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachmentUrl}
            alt={attachmentName}
            style={{
              maxWidth: '100%',
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s',
              borderRadius: 4,
              userSelect: 'none',
            }}
          />
        ) : isPdf ? (
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 16,
          }}>
            <iframe
              src={`${attachmentUrl}#toolbar=0`}
              style={{
                width: '100%',
                height: 'calc(100vh - 120px)',
                border: 'none',
                borderRadius: 8,
              }}
            />
          </div>
        ) : (
          <div style={{
            textAlign: 'center', color: 'white', padding: '40px 20px',
          }}>
            <FileText size={64} color="rgba(255,255,255,0.4)" strokeWidth={1} />
            <div style={{ fontSize: 16, marginTop: 16, marginBottom: 8 }}>
              {attachmentName}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
              이 파일 형식은 미리보기를 지원하지 않아요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
