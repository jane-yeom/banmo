'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface InstallGuideModalProps {
  onClose: () => void
}

const iosSteps = [
  {
    icon: '🧭',
    title: 'Safari로 접속',
    desc: 'Safari 브라우저로\nbamno.kr 에 접속해주세요',
    tip: '크롬 등 다른 브라우저에서는 설치가 안 돼요',
  },
  {
    icon: '📤',
    title: '공유 버튼 탭',
    desc: '하단 가운데 공유 버튼(📤)을\n탭해주세요',
    tip: '주소창 아래 툴바에 있어요',
  },
  {
    icon: '➕',
    title: '"홈 화면에 추가" 탭',
    desc: '스크롤을 내려\n"홈 화면에 추가"를 탭해주세요',
    tip: '아이콘과 함께 표시돼요',
  },
  {
    icon: '✅',
    title: '추가 완료!',
    desc: '우측 상단 "추가"를 탭하면\n홈 화면에 반모 아이콘이 생겨요!',
    tip: '이제 앱처럼 사용할 수 있어요 🎉',
  },
]

const androidSteps = [
  {
    icon: '🌐',
    title: 'Chrome으로 접속',
    desc: 'Chrome 브라우저로\nbamno.kr 에 접속해주세요',
    tip: '안드로이드 기본 브라우저예요',
  },
  {
    icon: '⋮',
    title: '메뉴 버튼 탭',
    desc: '주소창 오른쪽\n점 세개(⋮) 버튼을 탭해주세요',
    tip: '화면 우측 상단에 있어요',
  },
  {
    icon: '📲',
    title: '"앱 설치" 선택',
    desc: '메뉴에서 "앱 설치" 또는\n"홈 화면에 추가"를 탭해주세요',
    tip: '"앱 설치"가 없으면 "홈 화면에 추가"를 선택하세요',
  },
  {
    icon: '✅',
    title: '설치 완료!',
    desc: '"설치" 버튼을 탭하면\n홈 화면에 반모 아이콘이 생겨요!',
    tip: '이제 앱처럼 사용할 수 있어요 🎉',
  },
]

type Os = 'ios' | 'android' | 'other'

export default function InstallGuideModal({ onClose }: InstallGuideModalProps) {
  const [os, setOs] = useState<Os>('other')
  const [step, setStep] = useState(0)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    if (/iphone|ipad|ipod/.test(ua)) {
      setOs('ios')
    } else if (/android/.test(ua)) {
      setOs('android')
    } else {
      setOs('other')
    }
  }, [])

  const steps = os === 'ios' ? iosSteps : androidSteps
  const currentStep = steps[step]

  const osLabel =
    os === 'ios' ? 'iPhone / iPad 기준' :
    os === 'android' ? 'Android 기준' :
    'PC에서는 모바일로 접속해주세요'

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1C1C1C' }}>앱 설치 방법</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{osLabel}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <X size={22} color="#9CA3AF" />
          </button>
        </div>

        {os === 'other' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              스마트폰에서 설치해주세요
            </div>
            <div style={{
              background: '#F7F4ED', borderRadius: 14,
              padding: '20px', marginBottom: 16,
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                🍎 iPhone
              </div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7, marginBottom: 16 }}>
                1. Safari로 bamno.kr 접속<br/>
                2. 하단 공유 버튼(📤) 탭<br/>
                3. "홈 화면에 추가" 탭<br/>
                4. "추가" 탭
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>
                🤖 Android
              </div>
              <div style={{ fontSize: 13, color: '#555', lineHeight: 1.7 }}>
                1. Chrome으로 bamno.kr 접속<br/>
                2. 우측 상단 ⋮ 탭<br/>
                3. "앱 설치" 또는 "홈 화면에 추가" 탭<br/>
                4. "설치" 탭
              </div>
            </div>
            <p style={{ fontSize: 12, color: '#9CA3AF', lineHeight: 1.6 }}>
              스마트폰으로 QR 코드를 스캔하거나<br/>
              주소창에 bamno.kr 을 직접 입력해주세요
            </p>
          </div>
        ) : (
          <>
            {/* 스텝 인디케이터 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
              {steps.map((_, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1, height: 4, borderRadius: 2,
                    background: i <= step ? '#1C1C1C' : '#E5E7EB',
                    transition: 'background 0.2s',
                  }}
                />
              ))}
            </div>

            {/* 현재 스텝 카드 */}
            <div style={{
              background: '#F7F4ED', borderRadius: 16,
              padding: '28px 20px', textAlign: 'center',
              marginBottom: 20,
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{currentStep.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1C', marginBottom: 10 }}>
                {step + 1}단계: {currentStep.title}
              </div>
              <div style={{
                fontSize: 14, color: '#555', lineHeight: 1.8,
                whiteSpace: 'pre-line', marginBottom: 14,
              }}>
                {currentStep.desc}
              </div>
              <div style={{
                background: 'white', borderRadius: 10,
                padding: '10px 14px',
                fontSize: 12, color: '#888', lineHeight: 1.6,
                border: '1px solid #E8E4DC',
              }}>
                💡 {currentStep.tip}
              </div>
            </div>

            {/* 스텝 목록 (미니) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              {steps.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 14px', borderRadius: 12,
                    border: `1.5px solid ${i === step ? '#1C1C1C' : '#E8E4DC'}`,
                    background: i === step ? '#1C1C1C' : 'white',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{s.icon}</span>
                  <span style={{
                    fontSize: 13, fontWeight: 600,
                    color: i === step ? 'white' : i < step ? '#9CA3AF' : '#1C1C1C',
                    textDecoration: i < step ? 'line-through' : 'none',
                  }}>
                    {i + 1}. {s.title}
                  </span>
                  {i < step && (
                    <span style={{ marginLeft: 'auto', fontSize: 14 }}>✓</span>
                  )}
                </button>
              ))}
            </div>

            {/* 이전 / 다음 버튼 */}
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  style={{
                    flex: 1, padding: '14px',
                    background: 'white', border: '1.5px solid #E8E4DC',
                    borderRadius: 12, fontSize: 15, fontWeight: 600,
                    color: '#555', cursor: 'pointer',
                  }}
                >
                  ← 이전
                </button>
              )}
              {step < steps.length - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  style={{
                    flex: 1, padding: '14px',
                    background: '#1C1C1C', border: 'none',
                    borderRadius: 12, fontSize: 15, fontWeight: 700,
                    color: 'white', cursor: 'pointer',
                  }}
                >
                  다음 →
                </button>
              ) : (
                <button
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '14px',
                    background: '#1C1C1C', border: 'none',
                    borderRadius: 12, fontSize: 15, fontWeight: 700,
                    color: 'white', cursor: 'pointer',
                  }}
                >
                  설치하러 가기 🎉
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
