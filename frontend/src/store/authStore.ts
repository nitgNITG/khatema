import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  sessionDays: number;                          // stored so rehydration uses the right TTL
  setAuth: (user: User, token: string, sessionDays?: number) => void;
  clearAuth: () => void;
  updateUser: (user: Partial<User>) => void;
}

// The access_token cookie is only used by the Next.js middleware as a
// "user is logged in" signal — actual JWT validation happens on the backend.
// Its lifetime must match the refresh-token session so the middleware never
// redirects before the session truly expires.
const setAccessCookie = (token: string, days: number) => {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `access_token=${token}; path=/; max-age=${maxAge}; samesite=strict`;
};

const clearAccessCookie = () => {
  if (typeof document === 'undefined') return;
  document.cookie = 'access_token=; path=/; max-age=0';
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      sessionDays: 7,
      setAuth: (user, accessToken, sessionDays = 7) => {
        setAccessCookie(accessToken, sessionDays);
        set({ user, accessToken, isAuthenticated: true, sessionDays });
      },
      clearAuth: () => {
        clearAccessCookie();
        set({ user: null, accessToken: null, isAuthenticated: false, sessionDays: 7 });
      },
      updateUser: (partial) =>
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : null })),
    }),
    {
      name: 'khatma-auth',
      partialize: (s) => ({
        user: s.user,
        accessToken: s.accessToken,
        isAuthenticated: s.isAuthenticated,
        sessionDays: s.sessionDays,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-stamp the cookie on every page load so it never expires
        // prematurely while the refresh-token session is still valid.
        if (state?.accessToken) {
          setAccessCookie(state.accessToken, state.sessionDays ?? 7);
        }
      },
    }
  )
);
