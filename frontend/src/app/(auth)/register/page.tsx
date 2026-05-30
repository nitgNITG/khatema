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

const schema = z.object({
  displayName: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل'),
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم')
    .regex(/[!@#$%^&*]/, 'يجب أن تحتوي على رمز خاص'),
});

type FormData = z.infer<typeof schema>;

function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') || '/dashboard';
  const setAuth = useAuthStore((s) => s.setAuth);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/register', data);
      setAuth(res.data.data.user, res.data.data.accessToken);
      toast.success('تم إنشاء حسابك بنجاح!');
      router.push(redirect);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">ختمة</h1>
          <p className="text-muted">إنشاء حساب جديد</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">الاسم</label>
            <input
              {...register('displayName')}
              type="text"
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="أدخل اسمك"
            />
            {errors.displayName && <p className="text-destructive text-sm mt-1">{errors.displayName.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني</label>
            <input
              {...register('email')}
              type="email"
              dir="ltr"
              className="w-full border border-border rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="example@email.com"
            />
            {errors.email && <p className="text-destructive text-sm mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">كلمة المرور</label>
            <input
              {...register('password')}
              type="password"
              dir="ltr"
              className="w-full border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="8 أحرف على الأقل"
            />
            {errors.password && <p className="text-destructive text-sm mt-1">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white rounded-lg py-3 font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-3 text-muted">أو</span>
          </div>
        </div>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          className="flex items-center justify-center gap-3 w-full border border-border rounded-lg py-3 font-semibold hover:bg-gray-50 transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          التسجيل بـ Google
        </a>

        <p className="text-center text-sm text-muted mt-6">
          لديك حساب بالفعل؟{' '}
          <Link href={`/login${redirect !== '/dashboard' ? `?redirect=${encodeURIComponent(redirect)}` : ''}`} className="text-primary font-medium hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
