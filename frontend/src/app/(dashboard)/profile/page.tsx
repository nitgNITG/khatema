'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-4 text-center">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
    </div>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function ProfilePage() {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    toast.success('تم تسجيل الخروج');
    router.push('/login');
  };

  const initials = user?.displayName?.slice(0, 2) ?? '؟';

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-6">
      {/* Back */}
      <Link href="/dashboard" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground transition-colors">
        ← الرئيسية
      </Link>

      {/* Avatar + name */}
      <div className="bg-white border border-border rounded-2xl p-6 flex items-center gap-5">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt={user.displayName} className="w-20 h-20 rounded-full object-cover border-2 border-primary/20" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold border-2 border-primary/20">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{user?.displayName}</h1>
          {user?.email && <p className="text-sm text-muted mt-0.5" dir="ltr">{user.email}</p>}
        </div>
        <button
          onClick={handleLogout}
          className="shrink-0 border border-destructive/40 text-destructive rounded-xl px-4 py-2 text-sm font-semibold hover:bg-destructive/5 transition-colors"
        >
          تسجيل الخروج
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : profile ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="ختمات نشطة" value={profile.stats.totalKhatmasJoined} />
            <StatCard label="أجزاء أُتمّت" value={profile.stats.totalPartsCompleted} />
            <StatCard label="ختمات مكتملة" value={profile.stats.totalKhatmasCompleted} />
          </div>

          {/* Active reservations */}
          {profile.activeReservations?.length > 0 && (
            <section className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold">الأجزاء المحجوزة حالياً</h2>
              <div className="space-y-2">
                {profile.activeReservations.map((r: any) => (
                  <Link key={r.id} href={`/khatma/${r.khatmaId}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">الجزء {r.partNumber}</p>
                      <p className="text-xs text-muted">{r.khatmaTitle}</p>
                    </div>
                    <div className="text-left text-xs text-muted">
                      <p>بدأ: {formatDate(r.reservedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Completed parts */}
          {profile.completedParts?.length > 0 && (
            <section className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold">الأجزاء المكتملة</h2>
              <div className="space-y-2">
                {profile.completedParts.map((r: any) => (
                  <Link key={r.id} href={`/khatma/${r.khatmaId}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/30 transition-colors">
                    <div>
                      <p className="font-medium text-sm">الجزء {r.partNumber} ✓</p>
                      <p className="text-xs text-muted">{r.khatmaTitle}</p>
                    </div>
                    <div className="text-left text-xs text-muted space-y-0.5">
                      <p>بدأ: {formatDate(r.reservedAt)}</p>
                      <p>أتمّ: {formatDate(r.completedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Completed khatmas */}
          {profile.completedKhatmas?.length > 0 && (
            <section className="bg-white border border-border rounded-2xl p-5 space-y-3">
              <h2 className="font-semibold">الختمات المكتملة</h2>
              <div className="space-y-2">
                {profile.completedKhatmas.map((k: any) => (
                  <Link key={k.id} href={`/khatma/${k.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-green-200 bg-green-50 hover:border-green-400 transition-colors">
                    <p className="font-medium text-sm text-green-800">{k.title} ✓</p>
                    <div className="text-left text-xs text-green-700 space-y-0.5">
                      <p>بدأت: {formatDate(k.startDate)}</p>
                      <p>أُكملت: {formatDate(k.completedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {profile.activeReservations?.length === 0 && profile.completedParts?.length === 0 && profile.completedKhatmas?.length === 0 && (
            <div className="text-center py-12 text-muted bg-white border border-border rounded-2xl">
              <p className="text-3xl mb-3">📖</p>
              <p className="font-medium">لم تشارك في أي ختمة بعد</p>
              <Link href="/dashboard" className="mt-3 inline-block text-primary text-sm font-semibold hover:underline">
                ابدأ الآن
              </Link>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
