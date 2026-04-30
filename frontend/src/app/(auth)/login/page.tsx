'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Cookies from 'js-cookie';
import { useAuthStore } from '@/store/auth.store';
import { kakaoLogin } from '@/lib/kakao';
import apiClient from '@/lib/axios';

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다'),
});
type FormData = z.infer<typeof schema>;

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    nickname: string | null;
    email: string | null;
    profileImage: string | null;
    role: string;
    trustScore: number;
    noteGrade: string;
  };
}

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const [kakaoError, setKakaoError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const handleKakaoLogin = () => {
    console.log('[카카오] 로그인 버튼 클릭됨');
    setKakaoError(null);
    try {
      kakaoLogin(); // 리다이렉트 — 반환 없음
    } catch (err) {
      const message = err instanceof Error ? err.message : '카카오 로그인에 실패했습니다.';
      setKakaoError(message);
    }
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await apiClient.post<AuthResponse>('/auth/login', {
        email: data.email,
        password: data.password,
      });
      localStorage.setItem('accessToken', res.data.accessToken);
      Cookies.set('accessToken', res.data.accessToken, { expires: 7 });
      setAuth(res.data.user as any, res.data.accessToken);
      const params = new URLSearchParams(window.location.search);
      const redirectTo = params.get('redirect') || '/';
      window.location.href = redirectTo;
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? '로그인에 실패했습니다.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-6xl">🎵</div>
          <h1 className="text-2xl font-bold text-violet-700">반모</h1>
          <p className="mt-1 text-sm text-gray-500">반주의 모든것</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* 카카오 로그인 */}
          <button
            onClick={handleKakaoLogin}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] px-4 py-3.5 text-sm font-semibold text-[#191919] hover:opacity-90 transition-opacity shadow-sm mb-2"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.806 1 7.248c0 2.184 1.388 4.102 3.488 5.22l-.89 3.28c-.08.295.266.529.51.352L8.14 13.64c.285.032.573.05.86.05 4.418 0 8-2.806 8-6.248C17 3.806 13.418 1 9 1z" fill="#191919"/>
            </svg>
            카카오로 계속하기
          </button>

          {kakaoError && (
            <p className="mb-3 text-xs text-red-500 text-center">{kakaoError}</p>
          )}

          {/* 구분선 */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">이메일로 로그인</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* 이메일 로그인 폼 */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div>
              <input
                {...register('email')}
                type="email"
                placeholder="이메일"
                className="input-base"
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div>
              <input
                {...register('password')}
                type="password"
                placeholder="비밀번호"
                className="input-base"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>

            {serverError && (
              <p className="text-xs text-red-500 text-center">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white hover:bg-violet-800 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? '로그인 중...' : '로그인'}
            </button>
          </form>

          {/* 회원가입 링크 */}
          <p className="mt-5 text-center text-xs text-gray-500">
            계정이 없으신가요?{' '}
            <Link href="/signup" className="font-semibold text-violet-700 hover:underline">
              회원가입
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          가입 시{' '}
          <Link href="/terms" className="text-violet-600 hover:underline">이용약관</Link>
          {' '}및{' '}
          <Link href="/privacy" className="text-violet-600 hover:underline">개인정보처리방침</Link>에 동의합니다.
        </p>
      </div>
    </div>
  );
}
