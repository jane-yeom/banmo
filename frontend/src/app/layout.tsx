import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: '반모 - 반주의 모든것',
  description: '반주자 매칭 플랫폼 반모',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${notoSansKR.variable} font-sans bg-white antialiased`}>
        {/* 카카오 SDK */}
        <Script
          src="https://developers.kakao.com/sdk/js/kakao.js"
          strategy="afterInteractive"
        />
        {/* 토스페이먼츠 SDK */}
        <Script
          src="https://js.tosspayments.com/v1/payment"
          strategy="afterInteractive"
        />
        <ReactQueryProvider>
          {children}
          <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
