// 카카오 개발자 콘솔 설정 안내:
// 1. https://developers.kakao.com → 내 애플리케이션 → 앱 키
// 2. REST API 키 → NEXT_PUBLIC_KAKAO_REST_API_KEY 에 입력 (백엔드 KAKAO_REST_API_KEY 와 동일값)
// 3. JavaScript 키 → NEXT_PUBLIC_KAKAO_JS_KEY (현재 미사용, SDK 초기화용 예비)
// 4. 카카오 로그인 → Redirect URI: http://localhost:3000/auth/callback 등록 필수
// 5. 동의항목: 닉네임(필수), 프로필사진(선택), 이메일(선택)
//
// ⚠️ Kakao.Auth.authorize() 는 카카오톡 앱을 우선 시도해 PC에서 intent:// 오류 발생
//    → 카카오 OAuth URL을 직접 구성해 브라우저에서 카카오 계정(이메일) 로그인 유도

/**
 * 카카오 계정(이메일) 로그인 — 브라우저 리다이렉트 방식.
 * 인증 후 /auth/callback?code=xxx 로 돌아옵니다.
 */
export function kakaoLogin(): void {
  const REST_API_KEY = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;
  const REDIRECT_URI = 'http://localhost:3000/auth/callback';

  if (!REST_API_KEY) {
    console.error('NEXT_PUBLIC_KAKAO_REST_API_KEY 가 설정되지 않았습니다');
    alert('카카오 로그인 설정이 필요합니다');
    return;
  }

  const kakaoAuthUrl =
    `https://kauth.kakao.com/oauth/authorize` +
    `?client_id=${REST_API_KEY}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code`;

  console.log('[카카오] 로그인 URL:', kakaoAuthUrl);
  window.location.href = kakaoAuthUrl;
}

// initKakao 는 SDK 방식을 사용하는 경우에만 필요합니다.
// 현재는 직접 URL 방식을 사용하므로 실질적으로 호출되지 않습니다.
export function initKakao(): void {}
