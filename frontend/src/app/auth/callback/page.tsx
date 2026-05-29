'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const token = params.get('token');
    const userRaw = params.get('user');

    if (!token || !userRaw) {
      toast.error('فشل تسجيل الدخول، حاول مرة أخرى');
      router.replace('/login');
      return;
    }

    try {
      const user = JSON.parse(decodeURIComponent(userRaw));
      setAuth(user, token);
      toast.success('مرحباً بك!');
      router.replace('/dashboard');
    } catch {
      toast.error('فشل تسجيل الدخول، حاول مرة أخرى');
      router.replace('/login');
    }
  }, [params, router, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-muted">جارٍ تسجيل الدخول...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
