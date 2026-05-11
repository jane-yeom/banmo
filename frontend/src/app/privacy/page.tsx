'use client';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      <div style={{
        position: 'sticky', top: 0, background: 'white',
        borderBottom: '0.5px solid #DDD9EF',
        padding: '12px 16px', display: 'flex',
        alignItems: 'center', gap: 12, zIndex: 10,
      }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <ChevronLeft size={24} color="#7B82BE" strokeWidth={2} />
        </button>
        <h1 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>개인정보처리방침</h1>
      </div>
      <div style={{ padding: '24px 20px 100px', lineHeight: 1.8, color: '#1A1A1A' }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          시행일: 2026년 5월 1일
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제1조 (수집하는 개인정보)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          서비스는 다음과 같은 개인정보를 수집합니다.<br/>
          1. 카카오 로그인 시: 카카오 고유 ID, 닉네임, 프로필 사진, 이메일(선택)<br/>
          2. 서비스 이용 시: 작성한 공고, 채팅 내역, 활동 기록<br/>
          3. 자동 수집: 접속 IP, 기기 정보, 서비스 이용 기록
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제2조 (개인정보 수집 목적)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          1. 서비스 제공 및 회원 관리<br/>
          2. 부정 이용 방지 및 분쟁 해결<br/>
          3. 서비스 개선 및 신규 기능 개발
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제3조 (개인정보 보유 기간)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          1. 회원 정보: 탈퇴 후 즉시 삭제 (단, 관련 법령에 따라 일정 기간 보관)<br/>
          2. 거래 기록: 전자상거래법에 따라 5년 보관<br/>
          3. 채팅 내역: 분쟁 해결을 위해 탈퇴 후 30일 보관 후 삭제
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제4조 (개인정보 제3자 제공)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지 않습니다.<br/>
          단, 다음의 경우는 예외입니다.<br/>
          1. 이용자의 사전 동의가 있는 경우<br/>
          2. 법령에 의하거나 수사기관의 요청이 있는 경우
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제5조 (개인정보 파기)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          수집 목적이 달성된 개인정보는 지체 없이 파기합니다.<br/>
          전자적 파일은 복구 불가능한 방법으로 영구 삭제합니다.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제6조 (이용자 권리)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          이용자는 언제든지 다음 권리를 행사할 수 있습니다.<br/>
          1. 개인정보 열람 요청<br/>
          2. 개인정보 수정 요청<br/>
          3. 개인정보 삭제 요청 (회원 탈퇴)<br/>
          4. 개인정보 처리 정지 요청
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제7조 (개인정보 보호책임자)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          개인정보 관련 문의는 고객센터를 통해 접수해 주시기 바랍니다.
        </p>

        <div style={{
          marginTop: 40, padding: 16,
          background: '#F4F3F9', borderRadius: 12,
          fontSize: 13, color: '#666',
        }}>
          문의: 고객센터 → 문의하기<br/>
          서비스명: 반모 (반주의 모든것)
        </div>
      </div>
    </div>
  );
}
