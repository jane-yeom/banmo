import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token =
      localStorage.getItem('accessToken') ||
      document.cookie.match(/accessToken=([^;]+)/)?.[1];
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  console.log('[API 요청]', config.method?.toUpperCase(), config.url);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[API 오류]', error.response?.status, error.config?.url, error.response?.data);
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // 로그인/회원가입/콜백 페이지에서는 리다이렉트 안 함
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/signup' && !path.startsWith('/auth/')) {
        localStorage.removeItem('accessToken');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;
