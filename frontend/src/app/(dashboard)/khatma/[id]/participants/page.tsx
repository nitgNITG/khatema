'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';

function ProgressBar({ value, max = 30 }: { value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 mt-1">
      <div
        className="bg-primary h-2 rounded-full transition-all"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function ParticipantsPage() {
  const { id } = useParams<{ id: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ['khatma-participants', id],
    queryFn: () => api.get(`/khatmas/${id}/participants`).then((r) => r.data),
  });

  if (isLoading) return <div className="p-8 text-center text-muted">جارٍ التحميل...</div>;
  if (error) return <div className="p-8 text-center text-destructive">حدث خطأ في تحميل البيانات</div>;
  if (!data) return null;

  const { khatmaTitle, participants } = data as {
    khatmaTitle: string;
    participants: {
      id: string;
      role: string;
      joinedAt: string;
      user: { id: string; displayName: string; email?: string; avatarUrl?: string };
      reservedCount: number;
      completedCount: number;
      completionPct: number;
      reservedParts: { partNumber: number; reservedAt: string }[];
      completedParts: { partNumber: number; completedAt?: string }[];
    }[];
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`/khatma/${id}`} className="text-sm text-muted hover:text-foreground transition-colors">
          ← العودة للختمة
        </Link>
      </div>

      <h1 className="text-2xl font-bold">
        المشاركون في <span className="text-primary">{khatmaTitle}</span>
      </h1>

      <p className="text-muted text-sm">{participants.length} مشارك نشط</p>

      {/* Participants list */}
      <div className="space-y-4">
        {participants.map((p) => {
          const initials = p.user.displayName.slice(0, 2);
          return (
            <div key={p.id} className="bg-white border border-border rounded-2xl p-5 space-y-4">
              {/* Top row: avatar + name + role */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-primary/20 flex-shrink-0">
                  {p.user.avatarUrl ? (
                    <img src={p.user.avatarUrl} alt={p.user.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{p.user.displayName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.role === 'OWNER' ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
                      {p.role === 'OWNER' ? 'صاحب' : 'عضو'}
                    </span>
                  </div>
                  {p.user.email && (
                    <p className="text-xs text-muted mt-0.5" dir="ltr">{p.user.email}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-primary">{p.completedCount}/30</p>
                  <p className="text-xs text-muted">أجزاء</p>
                </div>
              </div>

              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>التقدم</span>
                  <span>{p.completionPct}%</span>
                </div>
                <ProgressBar value={p.completedCount} />
              </div>

              {/* Completed parts chips */}
              {p.completedParts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted mb-2">الأجزاء المكتملة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.completedParts.map((cp) => (
                      <span
                        key={cp.partNumber}
                        className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium"
                      >
                        ✓ جزء {cp.partNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Reserved (not yet done) parts chips */}
              {p.reservedParts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted mb-2">الأجزاء المحجوزة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {p.reservedParts.map((rp) => (
                      <span
                        key={rp.partNumber}
                        className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium"
                      >
                        جزء {rp.partNumber}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {p.completedParts.length === 0 && p.reservedParts.length === 0 && (
                <p className="text-xs text-muted">لم يحجز أي جزء بعد</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
