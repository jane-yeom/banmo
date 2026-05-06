/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'k.kakaocdn.net' },
      { protocol: 'https', hostname: '*.kakaocdn.net' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: '*.railway.app' },
      { protocol: 'https', hostname: 'pub-0f7951488c3d49b498e60ef2261a7fbe.r2.dev' },
      { protocol: 'https', hostname: '*.r2.dev' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    NEXT_PUBLIC_KAKAO_REST_API_KEY: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY,
  },
};

export default nextConfig;
