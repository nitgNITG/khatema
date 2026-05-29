'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface InviteInfo {
  khatma: {
    id: string;
    title: string;
    description?: string;
    type: string;
    status: string;
    _count: { participants: number };
  };
  senderName: string;
  expiresAt: string;
}

export default function JoinPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/khatmas/join/${token}`)
      .then((r) => setInfo(r.data))
      .catch((e) => setError(e.response?.data?.message || 'الدعوة غير صالحة'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleJoin = async () => {
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingInviteToken', token);
      router.push(`/register?redirect=/join/${token}`);
      return;
    }
    setJoining(true);
    try {
      await api.post(`/khatmas/${info!.khatma.id}/join`, { invitationToken: token });
      toast.success('انضممت للختمة بنجاح!');
      router.push(`/khatma/${info!.khatma.id}`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'حدث خطأ');
      if (e.response?.status === 409) {
        router.push(`/khatma/${info!.khatma.id}`);
      }
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted">جارٍ التحميل...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-white rounded-2xl border border-border p-8 max-w-sm w-full text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-lg font-bold text-destructive">{error}</h2>
          <button onClick={() => router.push('/dashboard')} className="w-full bg-primary text-white rounded-xl py-3 font-semibold">
            الذهاب للرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="bg-white rounded-2xl border border-border p-8 max-w-sm w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">📖</div>
          <h1 className="text-xl font-bold">دعوة للمشاركة</h1>
          <p className="text-muted text-sm">
            دعاك <strong className="text-foreground">{info!.senderName}</strong> للمشاركة في:
          </p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center space-y-1">
          <p className="text-lg font-bold text-primary">{info!.khatma.title}</p>
          {info!.khatma.description && (
            <p className="text-sm text-muted">{info!.khatma.description}</p>
          )}
          <p className="text-xs text-muted mt-2">
            {info!.khatma._count.participants} مشارك حالياً •{' '}
            {info!.khatma.type === 'COLLECTIVE' ? 'جماعية' : 'فردية'}
          </p>
        </div>

        {!isAuthenticated && (
          <p className="text-xs text-muted text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
            ستحتاج لإنشاء حساب أو تسجيل الدخول أولاً
          </p>
        )}

        <button
          onClick={handleJoin}
          disabled={joining || info!.khatma.status !== 'ACTIVE'}
          className="w-full bg-primary text-white rounded-xl py-3.5 font-bold text-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {joining ? 'جارٍ الانضمام...' : 'انضم للختمة'}
        </button>

        {info!.khatma.status !== 'ACTIVE' && (
          <p className="text-center text-sm text-destructive">هذه الختمة لم تعد نشطة</p>
        )}
      </div>
    </div>
  );
}
