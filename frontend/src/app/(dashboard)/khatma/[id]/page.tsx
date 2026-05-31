'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [selectedPart, setSelectedPart] = useState<QuranPart | null>(null);
  const [myReservedPart, setMyReservedPart] = useState<QuranPart | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

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

  const cancelReservationMutation = useMutation({
    mutationFn: (partId: string) =>
      api.delete(`/khatmas/${id}/parts/${partId}/my-reservation`).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.message || 'تم إلغاء الحجز');
      setMyReservedPart(null);
      queryClient.invalidateQueries({ queryKey: ['khatma', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'حدث خطأ');
      setMyReservedPart(null);
    },
  });

  const adminUnreserveMutation = useMutation({
    mutationFn: (partId: string) =>
      api.delete(`/khatmas/${id}/parts/${partId}/reservation`).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.message || 'تم إلغاء الحجز');
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

  const editMutation = useMutation({
    mutationFn: (data: { title: string; description: string; startDate: string | null; endDate: string | null }) =>
      api.patch(`/khatmas/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم التعديل');
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['khatma', id] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/khatmas/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم حذف الختمة');
      queryClient.invalidateQueries({ queryKey: ['my-khatmas'] });
      router.push('/dashboard');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
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

  const notifyMutation = useMutation({
    mutationFn: () => api.post(`/khatmas/${id}/notify`).then((r) => r.data),
    onSuccess: (res: any) => toast.success(res.message || 'تم إرسال التذكير'),
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const isAdmin = data?.creator?.id === user?.id;

  const handlePartClick = (part: QuranPart) => {
    if (part.reservedBy?.id === user?.id && part.status === 'RESERVED') {
      setMyReservedPart(part);
    } else if (part.status === 'AVAILABLE') {
      const now = new Date();
      if (data?.startDate && new Date(data.startDate) > now) return;
      setSelectedPart(part);
    }
  };

  const handleAdminUnreserve = (part: QuranPart) => {
    if (confirm(`إلغاء حجز الجزء ${part.partNumber} من ${part.reservedBy?.displayName}؟`)) {
      adminUnreserveMutation.mutate(part.id);
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
              {data.startDate && new Date(data.startDate) > new Date() && ` • يبدأ الحجز ${new Date(data.startDate).toLocaleDateString('ar-SA')}`}
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
            <Link
              href={`/khatma/${id}/participants`}
              className="bg-gray-100 text-gray-700 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-200 transition-colors"
            >
              المشاركون
            </Link>
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
          onAdminUnreserve={handleAdminUnreserve}
          isReadOnly={data.status === 'COMPLETED'}
          isAdmin={isAdmin}
        />
      </div>

      {/* Owner panel */}
      {data.creator?.id === user?.id && (
        <div className="bg-white rounded-2xl border border-border p-5 space-y-4">
          <h3 className="font-semibold">إعدادات الختمة</h3>

          {/* Allow repeat toggle */}
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

          {/* Edit title/description */}
          {!editMode ? (
            <button
              onClick={() => {
                setEditTitle(data.title);
                setEditDescription(data.description ?? '');
                setEditStartDate(data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '');
                setEditEndDate(data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : '');
                setEditMode(true);
              }}
              className="w-full text-right p-3 rounded-xl border border-border hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              ✏️ تعديل الاسم والتواريخ
            </button>
          ) : (
            <div className="space-y-3 p-3 border border-primary/30 rounded-xl bg-primary/5">
              <input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="اسم الختمة"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                placeholder="الوصف (اختياري)"
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted mb-1">تاريخ البداية</label>
                  <input
                    type="datetime-local"
                    value={editStartDate}
                    onChange={(e) => setEditStartDate(e.target.value)}
                    className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">تاريخ الانتهاء</label>
                  <input
                    type="datetime-local"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="w-full border border-border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => editMutation.mutate({
                    title: editTitle,
                    description: editDescription,
                    startDate: editStartDate || null,
                    endDate: editEndDate || null,
                  })}
                  disabled={!editTitle.trim() || editMutation.isPending}
                  className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
                >
                  {editMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ'}
                </button>
                <button onClick={() => setEditMode(false)} className="flex-1 border border-border rounded-lg py-2 text-sm font-semibold hover:bg-gray-50">
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {/* Notify participants */}
          <button
            onClick={() => notifyMutation.mutate()}
            disabled={notifyMutation.isPending}
            className="w-full p-3 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/5 disabled:opacity-50 transition-colors"
          >
            {notifyMutation.isPending ? 'جارٍ الإرسال...' : '🔔 إرسال تذكير للمشاركين'}
          </button>

          {notifyMutation.isSuccess && (notifyMutation.data as any)?.inviteUrl && (
            <div className="bg-gray-50 border border-border rounded-xl p-3 space-y-1">
              <p className="text-xs text-muted font-medium">رابط الدعوة (للمشاركة مع الآخرين)</p>
              <div className="flex gap-2 items-center">
                <input
                  readOnly
                  value={(notifyMutation.data as any).inviteUrl}
                  className="flex-1 border border-border rounded-lg px-2 py-1.5 text-xs bg-white"
                  dir="ltr"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText((notifyMutation.data as any).inviteUrl); toast.success('تم النسخ'); }}
                  className="text-xs border border-border rounded-lg px-2 py-1.5 hover:bg-gray-100"
                >
                  نسخ
                </button>
              </div>
            </div>
          )}

          {/* Delete khatma */}
          <button
            onClick={() => {
              if (confirm(`سيتم حذف "${data.title}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.`)) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
            className="w-full p-3 rounded-xl border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/5 disabled:opacity-50 transition-colors"
          >
            {deleteMutation.isPending ? 'جارٍ الحذف...' : '🗑️ حذف الختمة نهائياً'}
          </button>
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

      {/* Start date banner */}
      {data.startDate && new Date(data.startDate) > new Date() && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
          يبدأ الحجز في {new Date(data.startDate).toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      )}

      {/* My reserved part modal */}
      {myReservedPart && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold">الجزء {myReservedPart.partNumber}</h3>
            <p className="text-muted text-sm">ماذا تريد أن تفعل بالجزء {myReservedPart.partNumber}؟</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { completeMutation.mutate(myReservedPart.id); setMyReservedPart(null); }}
                disabled={completeMutation.isPending}
                className="w-full bg-primary text-white rounded-xl py-3 font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {completeMutation.isPending ? 'جارٍ التسجيل...' : 'أتممت القراءة'}
              </button>
              <button
                onClick={() => cancelReservationMutation.mutate(myReservedPart.id)}
                disabled={cancelReservationMutation.isPending}
                className="w-full border border-destructive/40 text-destructive rounded-xl py-3 font-semibold hover:bg-destructive/5 disabled:opacity-50 transition-colors"
              >
                {cancelReservationMutation.isPending ? 'جارٍ الإلغاء...' : 'إلغاء الحجز'}
              </button>
              <button
                onClick={() => setMyReservedPart(null)}
                className="w-full border border-border rounded-xl py-3 font-semibold hover:bg-gray-50 transition-colors"
              >
                تراجع
              </button>
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
