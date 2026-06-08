'use client'
import { useState, useEffect } from 'react'
import { X, ChevronRight, Smartphone } from 'lucide-react'

interface InstallGuideModalProps {
  onClose: () => void
}

export default function InstallGuideModal({ onClose }: InstallGuideModalProps) {
  const [os, setOs] = useState<'ios' | 'android' | 'other'>('other')
  const [step, setStep] = useState(1)

  useEffect(() => {
    const ua = navigator.userAgent
    if (/iPhone|iPad|iPod/.test(ua)) setOs('ios')
    else if (/Android/.test(ua)) setOs('android')
    else setOs('other')
  }, [])

  const iosSteps = [
    { icon: '🌐', title: 'Safari로 접속', desc: 'Chrome이 아닌 Safari 브라우저로\nbamno.kr 에 접속해주세요', tip: '아이폰 기본 브라우저예요' },
    { icon: '📤', title: '공유 버튼 탭', desc: '하단 가운데 공유 버튼을 탭해주세요', tip: '네모에 화살표 위로 향하는 아이콘이에요' },
    { icon: '➕', title: '홈 화면에 추가', desc: '스크롤해서 "홈 화면에 추가"를\n찾아서 탭해주세요', tip: '목록 중간쯤에 있어요' },
    { icon: '✅', title: '추가 완료!', desc: '"추가" 버튼을 탭하면\n홈 화면에 반모 아이콘이 생겨요!', tip: '이제 앱처럼 사용할 수 있어요 🎉' },
  ]

  const androidSteps = [
    { icon: '🌐', title: 'Chrome으로 접속', desc: 'Chrome 브라우저로\nbamno.kr 에 접속해주세요', tip: '안드로이드 기본 브라우저예요' },
    { icon: '⋮', title: '메뉴 버튼 탭', desc: '우측 상단 점 세개(⋮) 버튼을\n탭해주세요', tip: '주소창 오른쪽에 있어요' },
    { icon: '📱', title: '앱 설치 탭', desc: '"앱 설치" 또는\n"홈 화면에 추가"를 탭해주세요', tip: '메뉴 목록에서 찾을 수 있어요' },
    { icon: '✅', title: '설치 완료!', desc: '"설치" 버튼을 탭하면\n홈 화면에 반모 아이콘이 생겨요!', tip: '이제 앱처럼 사용할 수 있어요 🎉' },
  ]

  const steps = os === 'ios' ? iosSteps : androidSteps
  const currentStep = steps[step - 1]
  const totalSteps = steps.length

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'center',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'white',
        borderRadius: '24px 24px 0 0',
        width: '100%', maxWidth: 480,
        padding: '24px 20px 40px',
      }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, background: '#F0EDE6', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={20} color="#1C1C1C" strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>앱 설치하기</div>
              <div style={{ fontSize: 12, color: '#888' }}>
                {os === 'ios' ? 'iPhone 기준' : os === 'android' ? 'Android 기준' : '모바일에서 설치 가능해요'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={22} color="#9CA3AF" />
          </button>
        </div>

        {os === 'other' ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>모바일에서 설치해주세요</div>
            <p style={{ fontSize: 14, color: '#888', lineHeight: 1.6 }}>
              스마트폰으로 bamno.kr 에 접속해서<br/>
              홈 화면에 추가하면 앱처럼 사용할 수 있어요!
            </p>
          </div>
        ) : (
          <>
            {/* 진행 바 */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
              {steps.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 4, borderRadius: 2,
                  background: i < step ? '#1C1C1C' : '#F0EDE6',
                  transition: 'background 0.3s',
                }} />
              ))}
            </div>

            {/* 스텝 내용 */}
            <div style={{
              background: '#F7F4ED', borderRadius: 16,
              padding: '28px 20px', textAlign: 'center',
              marginBottom: 24, minHeight: 200,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: 52, marginBottom: 16 }}>{currentStep.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#1C1C1C' }}>
                {step}단계: {currentStep.title}
              </div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, whiteSpace: 'pre-line', marginBottom: 12 }}>
                {currentStep.desc}
              </p>
              <div style={{ background: 'white', borderRadius: 8, padding: '8px 14px', fontSize: 12, color: '#888', display: 'inline-block' }}>
                💡 {currentStep.tip}
              </div>
            </div>

            {/* 버튼 */}
            <div style={{ display: 'flex', gap: 10 }}>
              {step > 1 && (
                <button onClick={() => setStep(s => s - 1)} style={{
                  flex: 1, padding: '14px',
                  background: '#F0EDE6', color: '#1C1C1C',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                }}>
                  이전
                </button>
              )}
              {step < totalSteps ? (
                <button onClick={() => setStep(s => s + 1)} style={{
                  flex: 2, padding: '14px',
                  background: '#1C1C1C', color: 'white',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 6,
                }}>
                  다음 단계
                  <ChevronRight size={18} strokeWidth={2.5} />
                </button>
              ) : (
                <button onClick={onClose} style={{
                  flex: 2, padding: '14px',
                  background: '#1C1C1C', color: 'white',
                  border: 'none', borderRadius: 12,
                  fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}>
                  완료! 🎉
                </button>
              )}
            </div>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 14 }}>
              {step} / {totalSteps} 단계
            </p>
          </>
        )}
      </div>
    </div>
  )
}
