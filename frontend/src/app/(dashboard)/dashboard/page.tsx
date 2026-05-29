'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: khatmas, isLoading } = useQuery({
    queryKey: ['my-khatmas'],
    queryFn: () => api.get('/users/me/khatmas').then((r) => r.data),
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مرحباً، {user?.displayName} 👋</h1>
        <Link
          href="/khatma/new"
          className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          + ختمة جديدة
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-4">ختماتي</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !khatmas || khatmas.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-4xl mb-4">📖</p>
            <p className="text-lg font-medium">لا توجد ختمات بعد</p>
            <p className="text-sm mt-1">أنشئ أول ختمة واستدعُ أصدقاءك</p>
            <Link href="/khatma/new" className="mt-4 inline-block bg-primary text-white px-6 py-2.5 rounded-xl font-semibold">
              إنشاء ختمة
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {khatmas?.map((k: any) => (
              <Link
                key={k.id}
                href={`/khatma/${k.id}`}
                className="bg-white rounded-2xl border border-border p-5 hover:border-primary/30 hover:shadow-sm transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold line-clamp-1">{k.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    k.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {k.status === 'COMPLETED' ? 'مكتملة' : 'نشطة'}
                  </span>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${k.completionPercentage}%` }}
                  />
                </div>

                <div className="flex justify-between text-sm text-muted">
                  <span>{k.completionPercentage}% مكتمل</span>
                  <span>{k.participantCount} مشارك</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
