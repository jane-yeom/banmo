'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface InstallGuideModalProps {
  onClose: () => void
}

const BANMO_URL = 'https://banmo.kr'

type Os = 'ios' | 'android' | 'other'

export default function InstallGuideModal({ onClose }: InstallGuideModalProps) {
  const [os, setOs] = useState<Os>('other')
  const [isIosNonSafari, setIsIosNonSafari] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const ua = navigator.userAgent
    const uaLower = ua.toLowerCase()
    if (/iphone|ipad|ipod/.test(uaLower)) {
      setOs('ios')
      const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|kakaotalk/i.test(ua)
      if (!isSafari) setIsIosNonSafari(true)
    } else if (/android/.test(uaLower)) {
      setOs('android')
    }
  }, [])

  const copyUrl = () => {
    navigator.clipboard.writeText(BANMO_URL).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const osLabel =
    os === 'ios' ? 'iPhone / iPad' :
    os === 'android' ? 'Android' :
    '모바일에서 접속해주세요'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: 1000,
        display: 'flex', alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '20px 20px 0 0',
          width: '100%', maxWidth: 480,
          padding: '24px 20px 40px',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
      >
        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1C' }}>반모 앱 설치</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{osLabel} 기준</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={22} color="#9CA3AF" />
          </button>
        </div>

        {/* iOS - Safari가 아닌 브라우저 (Chrome, 카카오 등) */}
        {os === 'ios' && isIosNonSafari && (
          <div>
            <div style={{
              background: '#FFF3CD', borderRadius: 12,
              padding: '12px 14px', marginBottom: 20,
              fontSize: 13, color: '#856404', lineHeight: 1.6,
            }}>
              ⚠️ iPhone에서 앱 설치는 <strong>Safari</strong>에서만 가능합니다.
              아래 주소를 복사해 Safari에서 열어주세요.
            </div>

            {/* URL 복사 */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: '#1C1C1C', borderRadius: 12,
              padding: '12px 16px', marginBottom: 20,
            }}>
              <span style={{ flex: 1, fontSize: 15, color: 'white', fontWeight: 600 }}>banmo.kr</span>
              <button
                onClick={copyUrl}
                style={{
                  background: copied ? '#22C55E' : 'white',
                  color: copied ? 'white' : '#1C1C1C',
                  border: 'none', borderRadius: 8,
                  padding: '6px 16px', fontSize: 13,
                  fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', whiteSpace: 'nowrap',
                }}
              >
                {copied ? '복사됨 ✓' : '주소 복사'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { num: '1', text: '위 주소 복사 버튼을 눌러주세요' },
                { num: '2', text: '홈 화면 또는 앱 목록에서 Safari를 열어주세요' },
                { num: '3', text: '주소창을 탭하고 복사한 주소를 붙여넣기 후 이동해주세요' },
                { num: '4', text: '아래 단계에 따라 홈 화면에 추가해주세요 👇' },
              ].map(item => (
                <div key={item.num} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  background: '#F7F4ED', borderRadius: 12, padding: '12px 14px',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    background: '#1C1C1C', color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>{item.num}</div>
                  <span style={{ fontSize: 13, color: '#333', lineHeight: 1.6 }}>{item.text}</span>
                </div>
              ))}
            </div>

            <div style={{ height: 1, background: '#E8E4DC', margin: '20px 0' }} />
            <div style={{ fontSize: 13, color: '#888', fontWeight: 600, marginBottom: 12 }}>
              📤 Safari에서 홈 화면 추가하는 방법
            </div>
            <IosSteps />
          </div>
        )}

        {/* iOS - Safari */}
        {os === 'ios' && !isIosNonSafari && (
          <div>
            <div style={{
              background: '#E8F5E9', borderRadius: 12,
              padding: '12px 14px', marginBottom: 20,
              fontSize: 13, color: '#2E7D32',
            }}>
              ✅ Safari에서 바로 설치할 수 있어요!
            </div>
            <IosSteps />
          </div>
        )}

        {/* Android */}
        {os === 'android' && (
          <div>
            <div style={{
              background: '#E8F5E9', borderRadius: 12,
              padding: '12px 14px', marginBottom: 20,
              fontSize: 13, color: '#2E7D32',
            }}>
              ✅ Chrome 또는 삼성 인터넷에서 바로 설치할 수 있어요!
            </div>
            <AndroidSteps />
          </div>
        )}

        {/* PC / 기타 */}
        {os === 'other' && (
          <div>
            <div style={{
              background: '#F7F4ED', borderRadius: 14,
              padding: '20px', marginBottom: 16, textAlign: 'left',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🍎 iPhone 설치 방법</div>
              <IosSteps />
              <div style={{ height: 1, background: '#E8E4DC', margin: '16px 0' }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>🤖 Android 설치 방법</div>
              <AndroidSteps />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function IosSteps() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { num: '1', icon: '🧭', title: 'Safari로 banmo.kr 접속', desc: 'Safari 주소창에 banmo.kr 을 입력하고 이동해주세요.' },
        { num: '2', icon: '📤', title: '하단 공유 버튼 탭', desc: '화면 하단 가운데에 있는 공유 버튼(네모에 화살표)을 탭해주세요.' },
        { num: '3', icon: '➕', title: '"홈 화면에 추가" 선택', desc: '공유 메뉴를 아래로 스크롤해서 "홈 화면에 추가"를 탭해주세요.' },
        { num: '4', icon: '✅', title: '"추가" 탭하면 완료!', desc: '오른쪽 상단 "추가"를 탭하면 홈 화면에 반모 아이콘이 생겨요 🎉' },
      ].map(item => (
        <div key={item.num} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: '#F7F4ED', borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#1C1C1C', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
          }}>{item.num}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1C', marginBottom: 2 }}>
              {item.icon} {item.title}
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function AndroidSteps() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[
        { num: '1', icon: '🌐', title: 'Chrome으로 banmo.kr 접속', desc: 'Chrome 또는 삼성 인터넷 주소창에 banmo.kr 을 입력하고 이동해주세요.' },
        { num: '2', icon: '⋮', title: '우측 상단 메뉴 버튼 탭', desc: '주소창 오른쪽 점 세 개(⋮) 버튼을 탭해주세요.' },
        { num: '3', icon: '📲', title: '"앱 설치" 또는 "홈 화면에 추가" 선택', desc: '메뉴에서 "앱 설치"를 탭해주세요. 없으면 "홈 화면에 추가"를 선택하세요.' },
        { num: '4', icon: '✅', title: '"설치" 탭하면 완료!', desc: '설치 버튼을 탭하면 홈 화면에 반모 아이콘이 생겨요 🎉' },
      ].map(item => (
        <div key={item.num} style={{
          display: 'flex', alignItems: 'flex-start', gap: 12,
          background: '#F7F4ED', borderRadius: 12, padding: '12px 14px',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: '#1C1C1C', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
          }}>{item.num}</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1C1C1C', marginBottom: 2 }}>
              {item.icon} {item.title}
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
