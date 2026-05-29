'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { QuranPartsGrid } from '@/components/khatma/QuranPartsGrid';
import { KhatmaProgress } from '@/components/khatma/KhatmaProgress';
import { useRealtime } from '@/hooks/useRealtime';
import { QuranPart } from '@/types';

export default function KhatmaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedPart, setSelectedPart] = useState<QuranPart | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  // Real-time updates
  useRealtime(id);

  const { data, isLoading, error } = useQuery({
    queryKey: ['khatma', id],
    queryFn: () => api.get(`/khatmas/${id}`).then((r) => r.data),
  });

  const reserveMutation = useMutation({
    mutationFn: (partId: string) =>
      api.post(`/khatmas/${id}/parts/${partId}/reserve`).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.message || 'تم الحجز');
      setSelectedPart(null);
      queryClient.invalidateQueries({ queryKey: ['khatma', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشل الحجز');
      setSelectedPart(null);
    },
  });

  const completeMutation = useMutation({
    mutationFn: (partId: string) =>
      api.post(`/khatmas/${id}/parts/${partId}/complete`).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.message || 'أحسنت!');
      queryClient.invalidateQueries({ queryKey: ['khatma', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    },
  });

  const inviteMutation = useMutation({
    mutationFn: ({ email, name }: { email: string; name: string }) =>
      api.post(`/khatmas/${id}/invite/email`, { email, name }).then((r) => r.data),
    onSuccess: (res) => {
      toast.success('تم إرسال الدعوة!');
      setInviteLink(res.inviteUrl);
      setInviteEmail('');
      setInviteName('');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'فشل الإرسال'),
  });

  const getLinkMutation = useMutation({
    mutationFn: () => api.post(`/khatmas/${id}/invite`, {}).then((r) => r.data),
    onSuccess: (res) => setInviteLink(res.shareUrl),
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const settingsMutation = useMutation({
    mutationFn: (settings: { allowRepeat: boolean }) =>
      api.patch(`/khatmas/${id}/settings`, settings).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم تحديث الإعدادات');
      queryClient.invalidateQueries({ queryKey: ['khatma', id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const handlePartClick = (part: QuranPart) => {
    if (part.reservedBy?.id === user?.id && part.status === 'RESERVED') {
      // Their own reserved part → complete
      if (confirm(`هل أتممت قراءة الجزء ${part.partNumber}؟`)) {
        completeMutation.mutate(part.id);
      }
    } else if (part.status === 'AVAILABLE') {
      setSelectedPart(part);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-muted">جارٍ التحميل...</div>;
  if (error) return <div className="p-8 text-center text-destructive">حدث خطأ في تحميل الختمة</div>;
  if (!data) return null;

  const reservedCount = data.parts?.filter((p: QuranPart) => p.status === 'RESERVED').length ?? 0;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{data.title}</h1>
            {data.description && <p className="text-muted mt-1">{data.description}</p>}
            <p className="text-sm text-muted mt-2">
              {data.participantCount} مشارك
              {data.endDate && ` • تنتهي ${new Date(data.endDate).toLocaleDateString('ar-SA')}`}
              {data.isContinuous && ` • الدورة ${data.iteration}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {data.status === 'COMPLETED' && (
              <span className="bg-green-100 text-green-700 text-sm font-medium px-3 py-1 rounded-full">
                مكتملة ✓
              </span>
            )}
            {data.status === 'ACTIVE' && (
              <button
                onClick={() => { setShowInvite(true); if (!inviteLink) getLinkMutation.mutate(); }}
                className="bg-primary/10 text-primary border border-primary/30 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/20 transition-colors"
              >
                دعوة أصدقاء
              </button>
            )}
          </div>
        </div>

        <KhatmaProgress
          totalParts={data.totalParts}
          completedParts={data.completedParts}
          reservedParts={reservedCount}
        />
      </div>

      {/* Parts Grid */}
      <div className="bg-white rounded-2xl border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">الأجزاء</h2>
        <QuranPartsGrid
          parts={data.parts ?? []}
          myUserId={user?.id}
          onPartClick={handlePartClick}
          isReadOnly={data.status === 'COMPLETED'}
        />
      </div>

      {/* Owner settings panel */}
      {data.creator?.id === user?.id && (
        <div className="bg-white rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4">إعدادات الختمة</h3>
          <label className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-gray-50 cursor-pointer">
            <div>
              <p className="font-medium text-sm">السماح بحجز أكثر من جزء</p>
              <p className="text-xs text-muted">يمكن لكل مشارك حجز عدة أجزاء</p>
            </div>
            <button
              onClick={() => settingsMutation.mutate({ allowRepeat: !data.allowRepeat })}
              disabled={settingsMutation.isPending}
              className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${data.allowRepeat ? 'bg-primary' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${data.allowRepeat ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </label>
        </div>
      )}

      {/* Invite modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">دعوة أصدقاء</h3>
              <button onClick={() => setShowInvite(false)} className="text-muted hover:text-foreground text-xl leading-none">×</button>
            </div>

            {/* Share link */}
            <div>
              <p className="text-sm font-medium mb-2">رابط الدعوة</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={inviteLink || 'جارٍ التحميل...'}
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-gray-50 text-left"
                  dir="ltr"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(inviteLink); toast.success('تم النسخ!'); }}
                  disabled={!inviteLink}
                  className="bg-primary text-white rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  نسخ
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium">أو أرسل دعوة بالبريد الإلكتروني</p>
              <input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="الاسم (اختياري)"
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <input
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="البريد الإلكتروني"
                  type="email"
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  dir="ltr"
                />
                <button
                  onClick={() => inviteMutation.mutate({ email: inviteEmail, name: inviteName })}
                  disabled={!inviteEmail || inviteMutation.isPending}
                  className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {inviteMutation.isPending ? '...' : 'إرسال'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reserve confirmation modal */}
      {selectedPart && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold">حجز الجزء {selectedPart.partNumber}</h3>
            <p className="text-muted text-sm">هل تريد حجز الجزء {selectedPart.partNumber} من القرآن الكريم؟</p>
            <div className="flex gap-3">
              <button
                onClick={() => reserveMutation.mutate(selectedPart.id)}
                disabled={reserveMutation.isPending}
                className="flex-1 bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {reserveMutation.isPending ? 'جارٍ الحجز...' : 'احجز الآن'}
              </button>
              <button
                onClick={() => setSelectedPart(null)}
                className="flex-1 border border-border rounded-xl py-3 font-semibold hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
