import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import Cookies from 'js-cookie';

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoggedIn: false,
      setAuth: (user, accessToken) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
          Cookies.set('accessToken', accessToken, { expires: 7 });
        }
        set({ user, accessToken, isLoggedIn: true });
      },
      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          Cookies.remove('accessToken');
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
