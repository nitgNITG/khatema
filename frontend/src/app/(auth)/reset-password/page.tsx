'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';

const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const validate = () => {
    const e: { password?: string; confirm?: string } = {};
    if (password.length < 8) e.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    else if (!passwordRegex.test(password))
      e.password = 'يجب أن تحتوي على حرف كبير ورقم ورمز خاص (!@#$%^&*)';
    if (password !== confirm) e.confirm = 'كلمتا المرور غير متطابقتين';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    if (!token) {
      toast.error('رابط غير صالح');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('تم تغيير كلمة المرور');
      router.push('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8 text-center">
          <p className="text-destructive font-semibold">رابط غير صالح أو منتهي الصلاحية</p>
          <Link href="/forgot-password" className="mt-4 inline-block text-primary font-medium hover:underline text-sm">
            طلب رابط جديد
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">ختمة</h1>
          <p className="text-muted">إنشاء كلمة مرور جديدة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">كلمة المرور الجديدة</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              dir="ltr"
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="8 أحرف على الأقل"
            />
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">تأكيد كلمة المرور</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              dir="ltr"
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="أعد كتابة كلمة المرور"
            />
            {errors.confirm && <p className="text-destructive text-sm mt-1">{errors.confirm}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-3 font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
          </button>

          <p className="text-center text-sm text-muted">
            <Link href="/login" className="text-primary font-medium hover:underline">
              العودة لتسجيل الدخول
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
