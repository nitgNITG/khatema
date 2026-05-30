'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function VerifyEmailForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      router.replace('/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;
    setLoading(true);
    try {
      await api.post('/auth/verify-email', { otp });
      toast.success('تم التحقق من بريدك الإلكتروني!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'الرمز غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await api.post('/auth/send-email-otp');
      toast.success('تم إرسال رمز جديد إلى بريدك');
      setResendCooldown(60);
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 429) {
        toast.error(err.response?.data?.message || 'انتظر قبل المحاولة مجدداً');
        setResendCooldown(60);
      } else {
        toast.error(err.response?.data?.message || 'فشل الإرسال');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📧</div>
          <h1 className="text-2xl font-bold mb-2">تحقق من بريدك الإلكتروني</h1>
          <p className="text-muted text-sm">
            أرسلنا رمز مكون من 6 أرقام إلى{' '}
            <span className="font-medium text-foreground">{user?.email}</span>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">رمز التحقق</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-border rounded-lg px-4 py-3 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="______"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-primary text-white rounded-lg py-3 font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'جارٍ التحقق...' : 'تحقق'}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-muted mb-2">لم تستلم الرمز؟</p>
          <button
            onClick={handleResend}
            disabled={resendLoading || resendCooldown > 0}
            className="text-primary font-medium text-sm hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {resendCooldown > 0
              ? `إعادة الإرسال بعد ${resendCooldown}ث`
              : resendLoading
              ? 'جارٍ الإرسال...'
              : 'إعادة الإرسال'}
          </button>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-muted hover:text-foreground"
          >
            تخطي الآن
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <VerifyEmailForm />
    </Suspense>
  );
}
