import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

const setAccessCookie = (token: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `access_token=${token}; path=/; max-age=900; samesite=strict`;
};

const clearAccessCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = 'access_token=; path=/; max-age=0';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        setAccessCookie(accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      clearAuth: () => {
        clearAccessCookie();
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
      updateUser: (partial) =>
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
    }),
    {
      name: 'khatma-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, isAuthenticated: s.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessCookie(state.accessToken);
      },
    }
  )
);
