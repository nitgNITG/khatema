'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
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
  const queryClient = useQueryClient();
  const [collective, setCollective] = useState<number | null>(null);
  const [individual, setIndividual] = useState<number | null>(null);
  const [notifyHours, setNotifyHours] = useState<number[]>([24]);
  const [activeSort, setActiveSort] = useState<'khatma' | 'date-asc' | 'date-desc' | 'part-asc' | 'part-desc'>('khatma');
  const [completedSort, setCompletedSort] = useState<'khatma' | 'date-asc' | 'date-desc' | 'part-asc' | 'part-desc'>('khatma');

  const { data: profile, isLoading } = useQuery<any>({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  useEffect(() => {
    if (profile) {
      setCollective(profile.maxCollectiveKhatmas ?? 1);
      setIndividual(profile.maxIndividualKhatmas ?? 1);
      if (Array.isArray(profile.notifyBeforeHours)) {
        setNotifyHours(profile.notifyBeforeHours);
      }
    }
  }, [profile]);

  const notificationsMutation = useMutation({
    mutationFn: () => api.patch('/users/me/notifications', { notifyBeforeHours: notifyHours }).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم حفظ إعدادات التذكير');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
  });

  const toggleNotifyHour = (h: number) => {
    setNotifyHours((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h].sort((a, b) => b - a),
    );
  };

  const limitsMutation = useMutation({
    mutationFn: () => api.patch('/users/me/limits', {
      maxCollectiveKhatmas: collective,
      maxIndividualKhatmas: individual,
    }).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
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
          {profile.activeReservations?.length > 0 && (() => {
            const sorted = [...profile.activeReservations].sort((a: any, b: any) => {
              if (activeSort === 'date-asc') return new Date(a.reservedAt).getTime() - new Date(b.reservedAt).getTime();
              if (activeSort === 'date-desc') return new Date(b.reservedAt).getTime() - new Date(a.reservedAt).getTime();
              if (activeSort === 'part-asc') return a.partNumber - b.partNumber;
              if (activeSort === 'part-desc') return b.partNumber - a.partNumber;
              return a.khatmaTitle.localeCompare(b.khatmaTitle, 'ar');
            });
            const grouped: Record<string, { khatmaId: string; khatmaTitle: string; parts: any[] }> = {};
            for (const r of sorted) {
              if (!grouped[r.khatmaId]) grouped[r.khatmaId] = { khatmaId: r.khatmaId, khatmaTitle: r.khatmaTitle, parts: [] };
              grouped[r.khatmaId].parts.push(r);
            }
            return (
              <section className="bg-white border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">الأجزاء المحجوزة حالياً <span className="text-xs text-muted font-normal">({profile.activeReservations.length})</span></h2>
                  <select value={activeSort} onChange={(e) => setActiveSort(e.target.value as any)}
                    className="text-xs border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30">
                    <option value="khatma">ترتيب: الختمة</option>
                    <option value="part-asc">رقم الجزء ↑</option>
                    <option value="part-desc">رقم الجزء ↓</option>
                    <option value="date-desc">الأحدث أولاً</option>
                    <option value="date-asc">الأقدم أولاً</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {Object.values(grouped).map((g) => (
                    <div key={g.khatmaId}>
                      <Link href={`/khatma/${g.khatmaId}`} className="block text-xs font-semibold text-primary mb-1.5 hover:underline">
                        {g.khatmaTitle} ({g.parts.length})
                      </Link>
                      <div className="space-y-1.5 pr-2 border-r-2 border-primary/20">
                        {g.parts.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-border text-sm">
                            <span className="font-medium">الجزء {r.partNumber}</span>
                            <span className="text-xs text-muted">{formatDate(r.reservedAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Completed parts */}
          {profile.completedParts?.length > 0 && (() => {
            const sorted = [...profile.completedParts].sort((a: any, b: any) => {
              if (completedSort === 'date-asc') return new Date(a.completedAt ?? a.reservedAt).getTime() - new Date(b.completedAt ?? b.reservedAt).getTime();
              if (completedSort === 'date-desc') return new Date(b.completedAt ?? b.reservedAt).getTime() - new Date(a.completedAt ?? a.reservedAt).getTime();
              if (completedSort === 'part-asc') return a.partNumber - b.partNumber;
              if (completedSort === 'part-desc') return b.partNumber - a.partNumber;
              return a.khatmaTitle.localeCompare(b.khatmaTitle, 'ar');
            });
            const grouped: Record<string, { khatmaId: string; khatmaTitle: string; parts: any[] }> = {};
            for (const r of sorted) {
              if (!grouped[r.khatmaId]) grouped[r.khatmaId] = { khatmaId: r.khatmaId, khatmaTitle: r.khatmaTitle, parts: [] };
              grouped[r.khatmaId].parts.push(r);
            }
            return (
              <section className="bg-white border border-border rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">الأجزاء المكتملة <span className="text-xs text-muted font-normal">({profile.completedParts.length})</span></h2>
                  <select value={completedSort} onChange={(e) => setCompletedSort(e.target.value as any)}
                    className="text-xs border border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary/30">
                    <option value="khatma">ترتيب: الختمة</option>
                    <option value="part-asc">رقم الجزء ↑</option>
                    <option value="part-desc">رقم الجزء ↓</option>
                    <option value="date-desc">الأحدث أولاً</option>
                    <option value="date-asc">الأقدم أولاً</option>
                  </select>
                </div>
                <div className="space-y-4">
                  {Object.values(grouped).map((g) => (
                    <div key={g.khatmaId}>
                      <Link href={`/khatma/${g.khatmaId}`} className="block text-xs font-semibold text-green-700 mb-1.5 hover:underline">
                        {g.khatmaTitle} ({g.parts.length})
                      </Link>
                      <div className="space-y-1.5 pr-2 border-r-2 border-green-200">
                        {g.parts.map((r: any) => (
                          <div key={r.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-green-50 border border-green-100 text-sm">
                            <span className="font-medium text-green-800">الجزء {r.partNumber} ✓</span>
                            <span className="text-xs text-green-700">{formatDate(r.completedAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

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

          {/* Subscription limits */}
          <section className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="font-semibold">حدود الاشتراك</h2>
              <p className="text-xs text-muted mt-0.5">الحد الأقصى للختمات النشطة في نفس الوقت</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'جماعية', value: collective ?? profile.maxCollectiveKhatmas ?? 1, setter: setCollective },
                { label: 'فردية', value: individual ?? profile.maxIndividualKhatmas ?? 1, setter: setIndividual },
              ].map(({ label, value, setter }) => (
                <div key={label}>
                  <label className="block text-sm font-medium mb-2">{label}</label>
                  <select
                    value={value}
                    onChange={(e) => setter(Number(e.target.value))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} {n === 1 ? 'ختمة' : 'ختمات'}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <button
              onClick={() => limitsMutation.mutate()}
              disabled={limitsMutation.isPending}
              className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {limitsMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </section>

          {/* Notification preferences */}
          <section className="bg-white border border-border rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="font-semibold">تذكير قبل انتهاء الختمة</h2>
              <p className="text-xs text-muted mt-0.5">اختر متى تريد الحصول على تذكير قبل انتهاء الختمة</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {[1, 6, 12, 24, 48].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => toggleNotifyHour(h)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                    notifyHours.includes(h)
                      ? 'bg-primary text-white border-primary'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  {h === 1 ? 'ساعة واحدة' : h === 6 ? '6 ساعات' : h === 12 ? '12 ساعة' : h === 24 ? '24 ساعة' : '48 ساعة'}
                </button>
              ))}
            </div>
            <button
              onClick={() => notificationsMutation.mutate()}
              disabled={notificationsMutation.isPending}
              className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {notificationsMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
            </button>
          </section>

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
