import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
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
        if (newToken && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('khatma-auth');
            if (raw) {
              const stored = JSON.parse(raw);
              stored.state.accessToken = newToken;
              localStorage.setItem('khatma-auth', JSON.stringify(stored));
            }
            document.cookie = `access_token=${newToken}; path=/; max-age=900; samesite=strict`;
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
