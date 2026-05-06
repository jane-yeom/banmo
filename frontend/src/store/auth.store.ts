import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  nickname: string | null;
  email: string | null;
  profileImage: string | null;
  noteGrade: string;
  role: string;
  trustScore?: number;
  kakaoId?: string | null;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoggedIn: boolean;
  setAuth: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
}

function setCookie(token: string) {
  const maxAge = 7 * 24 * 60 * 60;
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? ';Secure' : '';
  document.cookie = `accessToken=${token};max-age=${maxAge};path=/${secure};SameSite=Lax`;
}

function removeCookie() {
  document.cookie = 'accessToken=;max-age=0;path=/';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoggedIn: false,
      setAuth: (user, accessToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          setCookie(accessToken);
        }
        set({ user, accessToken, isLoggedIn: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          removeCookie();
        }
        set({ user: null, accessToken: null, isLoggedIn: false });
      },
    }),
    {
      name: 'banmo-auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isLoggedIn: state.isLoggedIn,
      }),
    },
  ),
);
