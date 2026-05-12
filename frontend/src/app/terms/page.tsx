'use client';
import SubHeader from '@/components/layout/SubHeader';

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', minHeight: '100vh' }}>
      <SubHeader title="이용약관" />
      <div style={{ padding: '24px 20px 100px', lineHeight: 1.8, color: '#1A1A1A' }}>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>
          시행일: 2026년 5월 1일
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제1조 (목적)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          이 약관은 반모(이하 "서비스")가 제공하는 반주자 매칭 플랫폼 서비스의 이용조건 및 절차,
          이용자와 서비스 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제2조 (정의)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          1. "서비스"란 반모가 제공하는 반주자 및 연주자 매칭, 구인구직, 중고악기 거래,
          커뮤니티 등 일체의 서비스를 의미합니다.<br/>
          2. "이용자"란 이 약관에 동의하고 서비스를 이용하는 자를 말합니다.<br/>
          3. "공고"란 이용자가 서비스 내에 등록하는 구인구직, 홍보, 거래 게시물을 말합니다.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제3조 (약관의 효력 및 변경)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          1. 이 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.<br/>
          2. 서비스는 관련 법령에 위배되지 않는 범위에서 약관을 변경할 수 있습니다.<br/>
          3. 약관이 변경되는 경우 공지사항을 통해 사전 고지합니다.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제4조 (서비스 이용)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          1. 서비스는 카카오 계정을 통해 가입할 수 있습니다.<br/>
          2. 이용자는 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.<br/>
          3. 허위 공고, 사기 행위, 부당한 페이 제시 등은 서비스 이용이 제한될 수 있습니다.<br/>
          4. 공고 페이는 최저임금법에 따른 최저시급(10,030원) 이상이어야 합니다.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제5조 (이용자 의무)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          이용자는 다음 행위를 해서는 안 됩니다.<br/>
          1. 허위 정보 게시 또는 타인 사칭<br/>
          2. 다른 이용자에 대한 비방, 욕설, 혐오 표현<br/>
          3. 음란물 또는 불법 정보 게시<br/>
          4. 서비스를 이용한 스팸 또는 광고 행위<br/>
          5. 반주비 미지급 등 계약 불이행
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제6조 (서비스 중단)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          서비스는 시스템 점검, 천재지변 등 불가피한 경우 서비스를 일시 중단할 수 있으며,
          이로 인한 손해에 대해 고의 또는 중과실이 없는 한 책임을 지지 않습니다.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제7조 (면책조항)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          1. 서비스는 이용자 간의 거래에서 발생하는 분쟁에 직접 개입하지 않습니다.<br/>
          2. 이용자가 게시한 정보의 진실성에 대해 서비스는 보증하지 않습니다.<br/>
          3. 반주비, 레슨비 등 금전적 분쟁은 당사자 간 해결을 원칙으로 합니다.
        </p>

        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, marginTop: 28 }}>제8조 (분쟁 해결)</h2>
        <p style={{ fontSize: 14, color: '#444' }}>
          서비스와 이용자 간의 분쟁은 대한민국 법률에 따르며,
          관할 법원은 서울중앙지방법원으로 합니다.
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
