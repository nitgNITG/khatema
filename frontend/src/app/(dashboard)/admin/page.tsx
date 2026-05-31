'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'مدير عام',
  ADMIN: 'مشرف',
  MODERATOR: 'ناظم',
  USER: 'مستخدم',
};
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-orange-100 text-orange-700',
  MODERATOR: 'bg-blue-100 text-blue-700',
  USER: 'bg-gray-100 text-gray-700',
};

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

// ── Settings Panel ─────────────────────────────────────────────────────────
function SettingsPanel() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data),
  });

  const [form, setForm] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (settings && !dirty) setForm(settings);
  }, [settings, dirty]);

  const set = (key: string, val: any) => {
    setForm((f) => ({ ...f, [key]: val }));
    setDirty(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/admin/settings', form).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم حفظ الإعدادات');
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  if (isLoading) return <div className="py-6 text-center text-muted">جارٍ التحميل...</div>;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      <h2 className="font-semibold text-lg flex items-center gap-2">⚙️ إعدادات التطبيق</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Session Duration */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">مدة الجلسة (أيام)</label>
          <p className="text-xs text-muted">كم يوماً يبقى المستخدم مسجل الدخول دون نشاط</p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={90}
              value={form.sessionDurationDays ?? 7}
              onChange={(e) => set('sessionDurationDays', Number(e.target.value))}
              className="w-24 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            />
            <span className="text-sm text-muted">يوم</span>
          </div>
        </div>

        {/* Registration Mode */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">وضع التسجيل</label>
          <p className="text-xs text-muted">من يُسمح له بإنشاء حساب جديد</p>
          <div className="flex flex-col gap-2">
            {[
              ['OPEN', '🌍 مفتوح للجميع'],
              ['INVITE_ONLY', '🔗 بالدعوة فقط'],
              ['CLOSED', '🔒 مغلق'],
            ].map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio" name="registrationMode"
                  value={val}
                  checked={form.registrationMode === val}
                  onChange={() => set('registrationMode', val)}
                  className="accent-primary"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Default Khatma Limits */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">الحد الافتراضي للختمات الجماعية</label>
          <p className="text-xs text-muted">للمستخدمين الجدد عند التسجيل</p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={20}
              value={form.defaultMaxCollective ?? 3}
              onChange={(e) => set('defaultMaxCollective', Number(e.target.value))}
              className="w-24 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            />
            <span className="text-sm text-muted">ختمة</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium block">الحد الافتراضي للختمات الفردية</label>
          <p className="text-xs text-muted">للمستخدمين الجدد عند التسجيل</p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={1} max={20}
              value={form.defaultMaxIndividual ?? 3}
              onChange={(e) => set('defaultMaxIndividual', Number(e.target.value))}
              className="w-24 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            />
            <span className="text-sm text-muted">ختمة</span>
          </div>
        </div>

        {/* Max Participants */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">الحد الأقصى لمشاركي الختمة</label>
          <p className="text-xs text-muted">على مستوى النظام (يمكن تعديله لكل ختمة)</p>
          <div className="flex items-center gap-2">
            <input
              type="number" min={2} max={1000}
              value={form.maxKhatmaParticipants ?? 100}
              onChange={(e) => set('maxKhatmaParticipants', Number(e.target.value))}
              className="w-24 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background"
            />
            <span className="text-sm text-muted">مشارك</span>
          </div>
        </div>

        {/* Email notifications */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">الإشعارات بالبريد الإلكتروني</label>
          <p className="text-xs text-muted">تفعيل / تعطيل إرسال الإيميلات على مستوى النظام</p>
          <button
            type="button"
            onClick={() => set('emailNotificationsEnabled', !form.emailNotificationsEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.emailNotificationsEnabled ? 'bg-primary' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.emailNotificationsEnabled ? 'right-0.5' : 'left-0.5'}`} />
          </button>
          <p className="text-xs font-medium">{form.emailNotificationsEnabled ? '✅ مفعّل' : '🔕 معطّل'}</p>
        </div>
      </div>

      {/* Maintenance Mode */}
      <div className="border border-red-200 bg-red-50/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-red-700">وضع الصيانة</p>
            <p className="text-xs text-red-500">يمنع جميع المستخدمين من الدخول (عدا المدير)</p>
          </div>
          <button
            type="button"
            onClick={() => set('maintenanceMode', !form.maintenanceMode)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.maintenanceMode ? 'bg-red-500' : 'bg-border'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.maintenanceMode ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>
        {form.maintenanceMode && (
          <textarea
            value={form.maintenanceMessage ?? ''}
            onChange={(e) => set('maintenanceMessage', e.target.value)}
            placeholder="رسالة الصيانة (ستظهر للمستخدمين)..."
            rows={2}
            className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none bg-white"
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => saveMutation.mutate()}
          disabled={!dirty || saveMutation.isPending}
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {saveMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </button>
        {dirty && (
          <button
            onClick={() => { setForm(settings); setDirty(false); }}
            className="border border-border px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-border/40 transition-colors"
          >
            إلغاء
          </button>
        )}
        {dirty && <span className="text-xs text-amber-600">● تغييرات غير محفوظة</span>}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'settings'>('stats');
  const limit = 20;

  if (user?.role !== 'SUPER_ADMIN') {
    if (typeof window !== 'undefined') router.replace('/dashboard');
    return null;
  }

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users', page, search],
    queryFn: () =>
      api.get('/admin/users', { params: { page, limit, ...(search ? { search } : {}) } }).then((r) => r.data),
    enabled: activeTab === 'users',
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم تحديث الدور');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('تم حذف المستخدم');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'حدث خطأ'),
  });

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); setPage(1); };
  const handleDelete = (id: string, name: string) => {
    if (id === user?.id) { toast.error('لا يمكنك حذف حسابك الخاص'); return; }
    if (!confirm(`هل تريد حذف المستخدم "${name}" نهائياً؟`)) return;
    deleteUserMutation.mutate(id);
  };

  const pagination = usersData?.pagination;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-sm text-muted hover:text-foreground transition-colors">← الملف الشخصي</Link>
      </div>
      <h1 className="text-2xl font-bold">لوحة الإدارة</h1>

      {/* Stats bar always visible */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon="👤" label="المستخدمون" value={stats.totalUsers} />
          <StatCard icon="📖" label="الختمات النشطة" value={stats.activeKhatmas} />
          <StatCard icon="✅" label="الأجزاء المكتملة" value={stats.completedParts} />
          <StatCard icon="🎉" label="الختمات المكتملة" value={stats.completedKhatmas} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-border/40 rounded-xl p-1 w-fit">
        {([['stats', '📊 إحصائيات'], ['users', '👥 المستخدمون'], ['settings', '⚙️ الإعدادات']] as [typeof activeTab, string][]).map(([v, l]) => (
          <button key={v} onClick={() => setActiveTab(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === v ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}>
            {l}
          </button>
        ))}
      </div>

      {/* Stats tab */}
      {activeTab === 'stats' && stats && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold">إحصائيات تفصيلية</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            {[
              ['إجمالي المستخدمين', stats.totalUsers],
              ['المستخدمون الفعّالون', stats.activeUsers],
              ['إجمالي الختمات', stats.totalKhatmas],
              ['الختمات النشطة', stats.activeKhatmas],
              ['الختمات المكتملة', stats.completedKhatmas],
              ['إجمالي الأجزاء', stats.totalParts],
              ['الأجزاء المكتملة', stats.completedParts],
              ['الإشعارات المرسلة', stats.totalNotifications],
            ].map(([label, val]) => (
              <div key={label as string} className="bg-border/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-primary">{val}</p>
                <p className="text-xs text-muted mt-0.5">{label as string}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h2 className="font-semibold text-lg">إدارة المستخدمين</h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
                placeholder="بحث بالاسم أو البريد..."
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48 bg-background"
              />
              <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90">بحث</button>
              {search && (
                <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                  className="border border-border rounded-lg px-3 py-2 text-sm hover:bg-border/40">مسح</button>
              )}
            </form>
          </div>

          {usersLoading ? (
            <div className="py-8 text-center text-muted">جارٍ التحميل...</div>
          ) : usersData?.items?.length === 0 ? (
            <div className="py-8 text-center text-muted">لا يوجد مستخدمون</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted text-right">
                    <th className="py-2 px-3 font-medium">الاسم</th>
                    <th className="py-2 px-3 font-medium">البريد</th>
                    <th className="py-2 px-3 font-medium">الدور</th>
                    <th className="py-2 px-3 font-medium">مُفعَّل</th>
                    <th className="py-2 px-3 font-medium">الختمات</th>
                    <th className="py-2 px-3 font-medium">تاريخ الإنشاء</th>
                    <th className="py-2 px-3 font-medium">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {usersData?.items?.map((u: any) => (
                    <tr key={u.id} className="hover:bg-border/20 transition-colors">
                      <td className="py-2.5 px-3 font-medium">{u.displayName}</td>
                      <td className="py-2.5 px-3 text-muted" dir="ltr">{u.email ?? '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                          {ROLE_LABELS[u.role] ?? u.role}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {u.emailVerified ? <span className="text-green-600 font-medium">نعم</span> : <span className="text-red-500">لا</span>}
                      </td>
                      <td className="py-2.5 px-3 text-center">{u.khatmaCount}</td>
                      <td className="py-2.5 px-3 text-muted">{formatDate(u.createdAt)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <select value={u.role}
                            onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                            disabled={u.id === user?.id || updateRoleMutation.isPending}
                            className="border border-border rounded-lg px-2 py-1 text-xs focus:outline-none bg-background disabled:opacity-50">
                            <option value="USER">مستخدم</option>
                            <option value="MODERATOR">ناظم</option>
                            <option value="ADMIN">مشرف</option>
                            <option value="SUPER_ADMIN">مدير عام</option>
                          </select>
                          <button onClick={() => handleDelete(u.id, u.displayName)}
                            disabled={u.id === user?.id || deleteUserMutation.isPending}
                            className="text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1 text-xs font-medium transition-colors disabled:opacity-30">
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted">{pagination.total} مستخدم — صفحة {pagination.page} من {pagination.totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-border/40">السابق</button>
                <button onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={!pagination.hasNextPage}
                  className="border border-border rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-border/40">التالي</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Settings tab */}
      {activeTab === 'settings' && <SettingsPanel />}
    </div>
  );
}
