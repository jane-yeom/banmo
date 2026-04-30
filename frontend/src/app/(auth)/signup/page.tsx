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

const INSTRUMENTS = ['피아노', '바이올린', '첼로', '플루트', '기타', '드럼', '클라리넷', '트럼펫', '보컬', '작곡'];

const schema = z.object({
  email: z.string().email('올바른 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
  passwordConfirm: z.string(),
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 합니다').max(20, '닉네임은 20자 이하여야 합니다'),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['passwordConfirm'],
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

export default function SignupPage() {
  const { setAuth } = useAuthStore();
  const [instruments, setInstruments] = useState<string[]>([]);
  const [kakaoLoading, setKakaoLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const toggleInstrument = (inst: string) => {
    setInstruments((prev) =>
      prev.includes(inst) ? prev.filter((i) => i !== inst) : [...prev, inst]
    );
  };

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    try {
      const res = await apiClient.post<AuthResponse>('/auth/register', {
        email: data.email,
        password: data.password,
        nickname: data.nickname,
        instruments,
      });
      Cookies.set('accessToken', res.data.accessToken, { expires: 7 });
      setAuth(res.data.user as any, res.data.accessToken);
      window.location.href = '/';
    } catch (err: any) {
      setServerError(err?.response?.data?.message ?? '회원가입에 실패했습니다.');
    }
  };

  const handleKakaoLogin = async () => {
    setServerError(null);
    setKakaoLoading(true);
    try {
      await kakaoLogin();
    } catch (err: any) {
      setServerError(err instanceof Error ? err.message : '카카오 로그인에 실패했습니다.');
      setKakaoLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 text-center">
          <div className="mb-3 text-6xl">🎵</div>
          <h1 className="text-2xl font-bold text-violet-700">반모 회원가입</h1>
          <p className="mt-1 text-sm text-gray-500">반주의 모든것</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-lg">
          {/* 카카오 간편가입 */}
          <button
            onClick={handleKakaoLogin}
            disabled={kakaoLoading}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-[#FEE500] px-4 py-3.5 text-sm font-semibold text-[#191919] hover:opacity-90 transition-opacity shadow-sm mb-2 disabled:opacity-60"
          >
            {kakaoLoading ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
                처리 중...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.582 1 1 3.806 1 7.248c0 2.184 1.388 4.102 3.488 5.22l-.89 3.28c-.08.295.266.529.51.352L8.14 13.64c.285.032.573.05.86.05 4.418 0 8-2.806 8-6.248C17 3.806 13.418 1 9 1z" fill="#191919"/>
                </svg>
                카카오로 간편가입
              </>
            )}
          </button>

          {/* 구분선 */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-xs text-gray-400">이메일로 가입</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* 이메일 가입 폼 */}
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
                {...register('nickname')}
                type="text"
                placeholder="닉네임 (2~20자)"
                className="input-base"
              />
              {errors.nickname && <p className="mt-1 text-xs text-red-500">{errors.nickname.message}</p>}
            </div>
            <div>
              <input
                {...register('password')}
                type="password"
                placeholder="비밀번호 (8자 이상)"
                className="input-base"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div>
              <input
                {...register('passwordConfirm')}
                type="password"
                placeholder="비밀번호 확인"
                className="input-base"
              />
              {errors.passwordConfirm && <p className="mt-1 text-xs text-red-500">{errors.passwordConfirm.message}</p>}
            </div>

            {/* 악기 선택 */}
            <div>
              <p className="mb-2 text-xs font-medium text-gray-600">주 악기 선택 (선택사항)</p>
              <div className="flex flex-wrap gap-1.5">
                {INSTRUMENTS.map((inst) => (
                  <button
                    key={inst}
                    type="button"
                    onClick={() => toggleInstrument(inst)}
                    className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                      instruments.includes(inst)
                        ? 'border-violet-700 bg-violet-700 text-white'
                        : 'border-gray-200 text-gray-600 hover:border-violet-400'
                    }`}
                  >
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            {serverError && (
              <p className="text-xs text-red-500 text-center">{serverError}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white hover:bg-violet-800 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? '가입 중...' : '가입하기'}
            </button>
          </form>

          {/* 로그인 링크 */}
          <p className="mt-5 text-center text-xs text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-semibold text-violet-700 hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
