'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: () => api.get(`/groups/${id}`).then((r) => r.data),
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/groups/${id}/join`).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.status === 'PENDING' ? 'تم إرسال طلب الانضمام' : 'انضممت للمجموعة!');
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.post(`/groups/${id}/leave`).then((r) => r.data),
    onSuccess: () => {
      toast.success('غادرت المجموعة');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      router.push('/groups');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/groups/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم حذف المجموعة');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      router.push('/groups');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/groups/${id}/members/${userId}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم إزالة العضو');
      queryClient.invalidateQueries({ queryKey: ['group', id] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const fetchInviteCode = async () => {
    try {
      const res = await api.get(`/groups/${id}/invite-code`);
      setInviteCode(res.data.inviteCode);
      setShowInviteCode(true);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'حدث خطأ');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-gray-100 rounded-xl w-48" />
        <div className="h-32 bg-gray-100 rounded-2xl" />
        <div className="h-64 bg-gray-100 rounded-2xl" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center text-muted">
        <p className="text-3xl mb-3">😕</p>
        <p className="font-medium">المجموعة غير موجودة</p>
        <Link href="/groups" className="mt-4 inline-block text-primary text-sm hover:underline">← العودة للمجموعات</Link>
      </div>
    );
  }

  const isOwner = group.myRole === 'OWNER';
  const isAdmin = group.myRole === 'ADMIN' || isOwner;
  const isMember = group.isMember;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Back */}
      <Link href="/groups" className="text-sm text-muted hover:text-foreground transition-colors">
        ← المجموعات
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{group.name}</h1>
            {group.description && <p className="text-muted mt-1">{group.description}</p>}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
            group.visibility === 'PUBLIC' ? 'bg-green-100 text-green-700'
            : group.visibility === 'PRIVATE' ? 'bg-gray-100 text-gray-600'
            : 'bg-amber-100 text-amber-700'
          }`}>
            {group.visibility === 'PUBLIC' ? '🌍 عامة' : group.visibility === 'PRIVATE' ? '🔒 خاصة' : '🔗 بالدعوة'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted">
          <span>👥 {group.memberCount} عضو</span>
          {group.creator && <span>بواسطة {group.creator.displayName}</span>}
          {group.requireApproval && <span>🔐 يتطلب موافقة</span>}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          {!isMember && group.visibility !== 'INVITE_ONLY' && (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {joinMutation.isPending ? 'جارٍ الانضمام...' : 'انضم للمجموعة'}
            </button>
          )}
          {isMember && !isOwner && (
            <button
              onClick={() => leaveMutation.mutate()}
              disabled={leaveMutation.isPending}
              className="border border-red-200 text-red-500 px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              مغادرة المجموعة
            </button>
          )}
          {isAdmin && (
            <button
              onClick={fetchInviteCode}
              className="border border-primary text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
            >
              🔗 رمز الدعوة
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => setConfirmDelete(true)}
              className="border border-red-200 text-red-500 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              🗑 حذف المجموعة
            </button>
          )}
        </div>
      </div>

      {/* Invite code modal */}
      {showInviteCode && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">رمز الدعوة</h3>
            <p className="text-sm text-muted">شارك هذا الرمز مع من تريد دعوته للانضمام</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={inviteCode}
                className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-gray-50 font-mono"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(inviteCode); toast.success('تم النسخ!'); }}
                className="border border-primary text-primary px-4 rounded-xl text-sm font-semibold hover:bg-primary/5"
              >
                نسخ
              </button>
            </div>
            <button
              onClick={() => setShowInviteCode(false)}
              className="w-full border border-border rounded-xl py-2 text-sm font-semibold"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg text-red-600">حذف المجموعة</h3>
            <p className="text-sm text-muted">هل أنت متأكد؟ سيتم حذف المجموعة وإزالة جميع الأعضاء.</p>
            <div className="flex gap-2">
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'جارٍ الحذف...' : 'نعم، احذف'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-4 border border-border rounded-xl text-sm font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Members */}
      <section>
        <h2 className="text-lg font-semibold mb-4">الأعضاء ({group.memberCount})</h2>
        <div className="bg-white rounded-2xl border border-border divide-y divide-border">
          {(group.members ?? []).map((m: any) => (
            <div key={m.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {m.user.avatarUrl ? (
                  <img src={m.user.avatarUrl} alt={m.user.displayName} className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                    {m.user.displayName?.slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-medium text-sm">{m.user.displayName}</p>
                  <p className="text-xs text-muted">انضم {new Date(m.joinedAt).toLocaleDateString('ar-EG')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  m.role === 'OWNER' ? 'bg-primary/10 text-primary'
                  : m.role === 'ADMIN' ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
                }`}>
                  {m.role === 'OWNER' ? 'منشئ' : m.role === 'ADMIN' ? 'مشرف' : 'عضو'}
                </span>
                {isAdmin && m.user.id !== user?.id && m.role !== 'OWNER' && (
                  <button
                    onClick={() => removeMemberMutation.mutate(m.user.id)}
                    disabled={removeMemberMutation.isPending}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                  >
                    إزالة
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Khatmas in this group */}
      {group.khatmas && group.khatmas.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4">الختمات ({group.khatmas.length})</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {group.khatmas.map((k: any) => (
              <Link key={k.id} href={`/khatma/${k.id}`}
                className="bg-white rounded-2xl border border-border p-4 space-y-2 hover:border-primary/30 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm line-clamp-1">{k.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    k.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {k.status === 'COMPLETED' ? 'مكتملة' : 'نشطة'}
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${k.completionPercentage}%` }} />
                </div>
                <p className="text-xs text-muted">{k.completionPercentage}% مكتمل · {k.participantCount} مشارك</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
