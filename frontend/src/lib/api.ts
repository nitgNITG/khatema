import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token from persisted auth store
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('khatma-auth');
      const token = raw ? JSON.parse(raw)?.state?.accessToken : null;
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    } catch {}
  }
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const { data } = await api.post('/auth/refresh', {}, { withCredentials: true });
        const newToken = data?.data?.accessToken;
        const sessionDays = data?.data?.sessionDays ?? 7;
        if (newToken && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('khatma-auth');
            if (raw) {
              const stored = JSON.parse(raw);
              stored.state.accessToken = newToken;
              stored.state.sessionDays = sessionDays;
              localStorage.setItem('khatma-auth', JSON.stringify(stored));
            }
            const maxAge = sessionDays * 24 * 60 * 60;
            document.cookie = `access_token=${newToken}; path=/; max-age=${maxAge}; samesite=strict`;
          } catch {}
          original.headers['Authorization'] = `Bearer ${newToken}`;
        }
        return api(original);
      } catch {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
