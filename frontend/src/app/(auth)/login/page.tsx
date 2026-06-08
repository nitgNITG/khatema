'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/store/langStore';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/dashboard';
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t, dir, isAr } = useT();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.sessionDays);
      toast.success(isAr ? 'مرحباً بك!' : 'Welcome back!');
      router.push(redirectTo);
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background" dir={dir}>
      {/* ── Left panel — hero (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-primary flex-col justify-between p-12 relative overflow-hidden">
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />

        {/* Logo */}
        <Link href="/" className="relative text-white font-extrabold text-2xl">ختمة</Link>

        {/* Quote card */}
        <div className="relative space-y-6">
          <div className="float-anim bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-white border border-white/20">
            <p className="text-3xl mb-4">📗</p>
            <p className="text-lg font-bold leading-relaxed">
              {isAr ? '"خيركم من تعلّم القرآن وعلّمه"' : '"The best among you are those who learn the Quran and teach it"'}
            </p>
            <p className="text-white/70 text-sm mt-2">{isAr ? 'صحيح البخاري' : 'Sahih Al-Bukhari'}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-white">
            {(isAr ? [
              { icon: '🤝', label: 'ختمات جماعية' },
              { icon: '📊', label: 'تتبع التقدم' },
              { icon: '🔔', label: 'إشعارات فورية' },
              { icon: '🔒', label: 'خصوصية تامة' },
            ] : [
              { icon: '🤝', label: 'Group Khatmas' },
              { icon: '📊', label: 'Track Progress' },
              { icon: '🔔', label: 'Live Notifications' },
              { icon: '🔒', label: 'Full Privacy' },
            ]).map((f) => (
              <div key={f.label} className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2.5 text-sm font-medium">
                <span>{f.icon}</span>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom credit */}
        <div className="relative text-white/60 text-xs">
          {t('allRightsReserved')} © {new Date().getFullYear()} ختمة
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile brand */}
        <Link href="/" className="lg:hidden text-2xl font-extrabold text-primary mb-8">ختمة</Link>

        <div className="w-full max-w-md space-y-8">
          {/* Heading */}
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">{t('welcomeBack')}</h1>
            <p className="text-muted mt-2">{t('loginSubtitle')}</p>
          </div>

          {/* Google */}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className="btn-duo btn-duo-outline w-full gap-3 py-3"
          >
            <GoogleIcon />
            {t('signInWithGoogle')}
          </a>

          {/* Divider */}
          <div className="flex items-center gap-3 text-muted text-sm">
            <div className="flex-1 border-t border-border" />
            <span>{t('orWithEmail')}</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t('emailAddress')}</label>
              <input
                {...register('email')}
                type="email"
                dir="ltr"
                autoComplete="email"
                className="w-full border border-border bg-card rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted/60"
                placeholder={t('emailPlaceholder')}
              />
              {errors.email && <p className="text-destructive text-sm mt-1">{isAr ? 'بريد إلكتروني غير صالح' : 'Invalid email'}</p>}
            </div>

            <div>
              <div className={`flex items-center justify-between mb-1.5 ${isAr ? 'flex-row-reverse' : ''}`}>
                <label className="text-sm font-semibold">{t('password')}</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                  {t('forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="current-password"
                  className="w-full border border-border bg-card rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-destructive text-sm mt-1">{isAr ? 'أدخل كلمة المرور' : 'Password is required'}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-duo btn-duo-primary w-full py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:border-b-4"
            >
              {loading ? (
                <span className="flex items-center gap-2 justify-center">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                  </svg>
                  {t('signingIn')}
                </span>
              ) : t('signIn')}
            </button>
          </form>

          <p className="text-center text-sm text-muted">
            {t('noAccount')}{' '}
            <Link
              href={`/register${redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-primary font-bold hover:underline"
            >
              {t('registerFree')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
