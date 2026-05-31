'use client';

import { useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
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
          <p className="text-muted">استرداد كلمة المرور</p>
        </div>

        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">✓</span>
            </div>
            <p className="text-lg font-semibold">تم إرسال رابط إعادة التعيين على بريدك</p>
            <p className="text-sm text-muted">تحقق من بريدك الإلكتروني واتبع الرابط لإعادة تعيين كلمة المرور.</p>
            <Link href="/login" className="inline-block mt-4 text-primary font-medium hover:underline text-sm">
              العودة لتسجيل الدخول
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="w-full border border-border rounded-lg px-4 py-3 text-right focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="example@email.com"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-primary text-white rounded-lg py-3 font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'جارٍ الإرسال...' : 'إرسال رابط الاسترداد'}
            </button>

            <p className="text-center text-sm text-muted">
              <Link href="/login" className="text-primary font-medium hover:underline">
                العودة لتسجيل الدخول
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
