import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import Script from 'next/script';
import { Toaster } from 'react-hot-toast';
import './globals.css';
import ReactQueryProvider from '@/components/providers/ReactQueryProvider';
import AuthRestorer from '@/components/providers/AuthRestorer';
import FCMProvider from '@/components/providers/FCMProvider';

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
});

export const metadata: Metadata = {
  title: '반모 - 반주의 모든것',
  description: '반주자와 연주자를 연결하는 매칭 플랫폼. 피아노, 바이올린, 첼로 등 다양한 반주자를 찾아보세요.',
  keywords: '반주자, 반주, 피아노, 바이올린, 첼로, 레슨, 구인구직',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '반모',
    startupImage: '/icon-512.png',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: '반모 - 반주의 모든것',
    description: '반주자와 연주자를 연결하는 매칭 플랫폼',
    url: 'https://banmo.kr',
    siteName: '반모',
    images: [{ url: 'https://banmo.kr/banmo-logo.png' }],
    locale: 'ko_KR',
    type: 'website',
  },
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
          <AuthRestorer />
          <FCMProvider />
          <main style={{ paddingBottom: 80 }}>
            {children}
          </main>
          <Toaster
            position="bottom-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1A1A1A',
                color: 'white',
                borderRadius: '12px',
                fontSize: '14px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: { primary: '#5AAB7A', secondary: 'white' },
              },
              error: {
                iconTheme: { primary: '#EF4444', secondary: 'white' },
              },
            }}
          />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
