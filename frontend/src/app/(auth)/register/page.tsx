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
  displayName: z.string().min(2),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[!@#$%^&*]/),
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

function PasswordStrength({ password, isAr }: { password: string; isAr: boolean }) {
  const checks = [
    { label: isAr ? '٨ أحرف على الأقل' : '8+ characters', ok: password.length >= 8 },
    { label: isAr ? 'حرف كبير'          : 'Uppercase letter', ok: /[A-Z]/.test(password) },
    { label: isAr ? 'رقم'               : 'Number', ok: /[0-9]/.test(password) },
    { label: isAr ? 'رمز خاص'          : 'Special char', ok: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const colors = ['bg-border', 'bg-destructive', 'bg-warning', 'bg-secondary', 'bg-success'];

  return (
    <div className="mt-2 space-y-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full transition-all ${i < score ? colors[score] : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1 text-xs ${c.ok ? 'text-success' : 'text-muted'}`}>
            <span>{c.ok ? '✓' : '○'}</span>
            <span>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get('redirect') || '/dashboard';
  const setAuth = useAuthStore((s) => s.setAuth);
  const { t, dir, isAr } = useT();

  const { register, handleSubmit, formState: { errors }, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const pwd = watch('password', '');

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      setAuth(res.data.data.user, res.data.data.accessToken, res.data.data.sessionDays);
      toast.success(isAr ? 'تم إنشاء حسابك! تحقق من بريدك الإلكتروني' : 'Account created! Check your email.');
      router.push('/verify-email');
    } catch (err: any) {
      toast.error(err.response?.data?.message || (isAr ? 'حدث خطأ، حاول مرة أخرى' : 'An error occurred, please try again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background" dir={dir}>
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-secondary flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/10 rounded-full translate-y-1/3 -translate-x-1/3" />

        <Link href="/" className="relative text-white font-extrabold text-2xl">ختمة</Link>

        <div className="relative space-y-5">
          <div className="float-anim bg-white/15 backdrop-blur-sm rounded-2xl p-6 text-white border border-white/20">
            <p className="text-4xl mb-4">🌙</p>
            <p className="text-xl font-extrabold mb-1">
              {isAr ? 'انضم لمجتمع القرّاء' : 'Join the Readers Community'}
            </p>
            <p className="text-white/80 text-sm leading-relaxed">
              {isAr
                ? 'سجّل حسابك المجاني وابدأ رحلتك مع القرآن الكريم اليوم. شارك مع عائلتك وأصدقائك واختم القرآن معاً.'
                : 'Create your free account and start your Quran journey today. Share with family and friends and complete the Quran together.'}
            </p>
          </div>

          {/* Mini testimonials */}
          {(isAr ? [
            { name: 'أحمد م.', text: 'أنهينا ختمة رمضان كاملة مع العائلة — تجربة لا تُنسى!', emoji: '⭐⭐⭐⭐⭐' },
            { name: 'فاطمة س.', text: 'أخيراً تطبيق يجمع العائلة على القرآن بسهولة.', emoji: '⭐⭐⭐⭐⭐' },
          ] : [
            { name: 'Ahmed M.', text: 'We completed a full Ramadan khatma with the family — an unforgettable experience!', emoji: '⭐⭐⭐⭐⭐' },
            { name: 'Fatima S.', text: 'Finally an app that easily brings the family together around the Quran.', emoji: '⭐⭐⭐⭐⭐' },
          ]).map((item) => (
            <div key={item.name} className="bg-white/10 rounded-xl p-4 text-white border border-white/15">
              <p className="text-xs mb-1">{item.emoji}</p>
              <p className="text-sm leading-relaxed">"{item.text}"</p>
              <p className="text-white/60 text-xs mt-1">— {item.name}</p>
            </div>
          ))}
        </div>

        <div className="relative text-white/60 text-xs">
          {t('allRightsReserved')} © {new Date().getFullYear()} ختمة
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <Link href="/" className="lg:hidden text-2xl font-extrabold text-primary mb-8">ختمة</Link>

        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">{t('createAccount')}</h1>
            <p className="text-muted mt-2">{t('registerSubtitle')}</p>
          </div>

          {/* Google */}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
            className="btn-duo btn-duo-outline w-full gap-3 py-3"
          >
            <GoogleIcon />
            {t('registerWithGoogle')}
          </a>

          <div className="flex items-center gap-3 text-muted text-sm">
            <div className="flex-1 border-t border-border" />
            <span>{t('orWithEmail')}</span>
            <div className="flex-1 border-t border-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1.5">{t('displayName')}</label>
              <input
                {...register('displayName')}
                type="text"
                autoComplete="name"
                className="w-full border border-border bg-card rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors placeholder:text-muted/60"
                placeholder={t('namePlaceholder')}
              />
              {errors.displayName && <p className="text-destructive text-sm mt-1">{isAr ? 'الاسم يجب أن يكون حرفين على الأقل' : 'Name must be at least 2 characters'}</p>}
            </div>

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
              <label className="block text-sm font-semibold mb-1.5">{t('password')}</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  dir="ltr"
                  autoComplete="new-password"
                  className="w-full border border-border bg-card rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                  placeholder={isAr ? '٨ أحرف على الأقل' : '8+ characters'}
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
              {pwd && <PasswordStrength password={pwd} isAr={isAr} />}
              {errors.password && <p className="text-destructive text-sm mt-1">{isAr ? 'كلمة المرور لا تستوفي المتطلبات' : 'Password does not meet requirements'}</p>}
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
                  {t('creatingAccount')}
                </span>
              ) : t('createFree')}
            </button>
          </form>

          <p className="text-center text-xs text-muted">
            {t('agreeToTerms')}{' '}
            <Link href="/terms" className="text-primary hover:underline">{t('terms')}</Link>
            {' '}{t('andText')}{' '}
            <Link href="/privacy" className="text-primary hover:underline">{t('privacy')}</Link>
          </p>

          <p className="text-center text-sm text-muted">
            {t('haveAccount')}{' '}
            <Link
              href={`/login${redirectTo !== '/dashboard' ? `?redirect=${encodeURIComponent(redirectTo)}` : ''}`}
              className="text-primary font-bold hover:underline"
            >
              {t('signIn')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
