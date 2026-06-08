'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'مدير عام', ADMIN: 'مشرف', MODERATOR: 'ناظم', USER: 'مستخدم',
};
const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700', ADMIN: 'bg-orange-100 text-orange-700',
  MODERATOR: 'bg-blue-100 text-blue-700', USER: 'bg-gray-100 text-gray-700',
};
const SUGGESTION_STATUS: Record<string, string> = {
  PENDING: '⏳ قيد الانتظار', REVIEWED: '👀 تمت المراجعة',
  IMPLEMENTED: '✅ مُطبَّق', REJECTED: '❌ مرفوض',
};

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 text-center">
      <p className="text-2xl mb-1">{icon}</p>
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  );
}

// ── Settings Panel ────────────────────────────────────────────────────────
function SettingsPanel() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then((r) => r.data),
  });
  const [form, setForm] = useState<Record<string, any>>({});
  const [dirty, setDirty] = useState(false);

  useEffect(() => { if (settings && !dirty) setForm(settings); }, [settings, dirty]);
  const set = (k: string, v: any) => { setForm((f) => ({ ...f, [k]: v })); setDirty(true); };

  const saveMutation = useMutation({
    mutationFn: () => api.patch('/admin/settings', form).then((r) => r.data),
    onSuccess: () => { toast.success('تم حفظ الإعدادات'); setDirty(false); queryClient.invalidateQueries({ queryKey: ['admin-settings'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  if (isLoading) return <div className="py-6 text-center text-muted">جارٍ التحميل...</div>;
  return (
    <div className="bg-card border border-border rounded-2xl p-6 space-y-6">
      <h2 className="font-semibold text-lg">⚙️ إعدادات التطبيق</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">مدة الجلسة (أيام)</label>
          <p className="text-xs text-muted">كم يوماً يبقى المستخدم مسجل الدخول</p>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={90} value={form.sessionDurationDays ?? 7}
              onChange={(e) => set('sessionDurationDays', Number(e.target.value))}
              className="w-24 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
            <span className="text-sm text-muted">يوم</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">وضع التسجيل</label>
          <p className="text-xs text-muted">من يُسمح له بإنشاء حساب جديد</p>
          <div className="flex flex-col gap-2">
            {[['OPEN', '🌍 مفتوح'], ['INVITE_ONLY', '🔗 بالدعوة'], ['CLOSED', '🔒 مغلق']].map(([v, l]) => (
              <label key={v} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="reg" value={v} checked={form.registrationMode === v}
                  onChange={() => set('registrationMode', v)} className="accent-primary" />
                <span className="text-sm">{l}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">الحد الافتراضي للختمات الجماعية</label>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={20} value={form.defaultMaxCollective ?? 3}
              onChange={(e) => set('defaultMaxCollective', Number(e.target.value))}
              className="w-24 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
            <span className="text-sm text-muted">ختمة</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">الحد الافتراضي للختمات الفردية</label>
          <div className="flex items-center gap-2">
            <input type="number" min={1} max={20} value={form.defaultMaxIndividual ?? 3}
              onChange={(e) => set('defaultMaxIndividual', Number(e.target.value))}
              className="w-24 border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
            <span className="text-sm text-muted">ختمة</span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium block">الإشعارات بالبريد</label>
          <button type="button" onClick={() => set('emailNotificationsEnabled', !form.emailNotificationsEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.emailNotificationsEnabled ? 'bg-primary' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.emailNotificationsEnabled ? 'right-0.5' : 'left-0.5'}`} />
          </button>
          <p className="text-xs font-medium">{form.emailNotificationsEnabled ? '✅ مفعّل' : '🔕 معطّل'}</p>
        </div>
      </div>
      <div className="border border-red-200 bg-red-50/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-red-700">وضع الصيانة</p>
            <p className="text-xs text-red-500">يمنع جميع المستخدمين من الدخول</p>
          </div>
          <button type="button" onClick={() => set('maintenanceMode', !form.maintenanceMode)}
            className={`relative w-11 h-6 rounded-full transition-colors ${form.maintenanceMode ? 'bg-red-500' : 'bg-border'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.maintenanceMode ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>
        {form.maintenanceMode && (
          <textarea value={form.maintenanceMessage ?? ''} onChange={(e) => set('maintenanceMessage', e.target.value)}
            placeholder="رسالة الصيانة..." rows={2}
            className="w-full border border-red-200 rounded-xl px-3 py-2 text-sm focus:outline-none resize-none bg-white" />
        )}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => saveMutation.mutate()} disabled={!dirty || saveMutation.isPending}
          className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
          {saveMutation.isPending ? 'جارٍ الحفظ...' : 'حفظ الإعدادات'}
        </button>
        {dirty && <button onClick={() => { setForm(settings); setDirty(false); }}
          className="border border-border px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-border/40">إلغاء</button>}
        {dirty && <span className="text-xs text-amber-600">● تغييرات غير محفوظة</span>}
      </div>
    </div>
  );
}

// ── Articles Panel ────────────────────────────────────────────────────────
function ArticlesPanel() {
  const queryClient = useQueryClient();
  const [genCount, setGenCount] = useState(5);
  const [editArticle, setEditArticle] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ titleAr: '', titleEn: '', contentAr: '', contentEn: '', excerptAr: '', excerptEn: '', tags: '', status: 'PUBLISHED' });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-articles'],
    queryFn: () => api.get('/admin/articles?limit=50').then((r) => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: (count: number) => api.post('/admin/articles/generate', { count }).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(`تم توليد ${res.generated} مقال بنجاح!`);
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ في التوليد'),
  });

  const saveMutation = useMutation({
    mutationFn: (d: any) => editArticle
      ? api.patch(`/admin/articles/${editArticle.id}`, d).then((r) => r.data)
      : api.post('/admin/articles', d).then((r) => r.data),
    onSuccess: () => {
      toast.success(editArticle ? 'تم تحديث المقال' : 'تم إنشاء المقال');
      queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
      setShowForm(false); setEditArticle(null);
      setForm({ titleAr: '', titleEn: '', contentAr: '', contentEn: '', excerptAr: '', excerptEn: '', tags: '', status: 'PUBLISHED' });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/articles/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('تم حذف المقال'); queryClient.invalidateQueries({ queryKey: ['admin-articles'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const togglePublish = (article: any) =>
    saveMutation.mutate({ status: article.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' });

  const openEdit = (article: any) => {
    setEditArticle(article);
    setForm({
      titleAr: article.titleAr || '', titleEn: article.titleEn || '',
      contentAr: article.contentAr || '', contentEn: article.contentEn || '',
      excerptAr: article.excerptAr || '', excerptEn: article.excerptEn || '',
      tags: article.tags || '', status: article.status,
    });
    setShowForm(true);
  };

  return (
    <div className="space-y-5">
      {/* AI Generate bar */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-5 flex items-center gap-4 flex-wrap">
        <div className="flex-1">
          <p className="font-bold text-sm">🤖 توليد مقالات بالذكاء الاصطناعي</p>
          <p className="text-xs text-muted mt-0.5">يُولّد مقالات عربية وإنجليزية عن فضل القرآن والأعمال الصالحة</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="number" min={1} max={10} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))}
            className="w-16 border border-border rounded-lg px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
          <span className="text-sm text-muted">مقال</span>
          <button
            onClick={() => generateMutation.mutate(genCount)}
            disabled={generateMutation.isPending}
            className="btn-duo btn-duo-primary text-sm px-4 py-2 disabled:opacity-60 disabled:transform-none disabled:border-b-2"
          >
            {generateMutation.isPending ? '⏳ جارٍ التوليد...' : '✨ توليد'}
          </button>
        </div>
      </div>

      {/* Add button */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{data?.pagination?.total ?? 0} مقال</h3>
        <button onClick={() => { setEditArticle(null); setShowForm((s) => !s); }}
          className="btn-duo btn-duo-outline text-sm px-4 py-2">
          {showForm ? 'إلغاء' : '+ مقال جديد'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold">{editArticle ? 'تعديل المقال' : 'مقال جديد'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['titleAr', 'العنوان (عربي)', false],
              ['titleEn', 'Title (English)', false],
              ['excerptAr', 'ملخص (عربي)', false],
              ['excerptEn', 'Excerpt (English)', false],
              ['tags', 'التاقات (مفصولة بفاصلة)', false],
            ].map(([key, label]) => (
              <div key={key as string}>
                <label className="block text-xs font-semibold mb-1 text-muted">{label as string}</label>
                <input type="text" value={(form as any)[key as string]}
                  onChange={(e) => setForm((f) => ({ ...f, [key as string]: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted">الحالة</label>
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none bg-background">
                <option value="PUBLISHED">منشور</option>
                <option value="DRAFT">مسودة</option>
              </select>
            </div>
          </div>
          {[['contentAr', 'المحتوى (عربي) — HTML مسموح'], ['contentEn', 'Content (English) — HTML allowed']].map(([key, label]) => (
            <div key={key as string}>
              <label className="block text-xs font-semibold mb-1 text-muted">{label as string}</label>
              <textarea value={(form as any)[key as string]}
                onChange={(e) => setForm((f) => ({ ...f, [key as string]: e.target.value }))}
                rows={6}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background resize-y" />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => saveMutation.mutate(form)} disabled={saveMutation.isPending || !form.titleAr}
              className="bg-primary text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50">
              {saveMutation.isPending ? 'جارٍ الحفظ...' : editArticle ? 'حفظ التعديلات' : 'نشر المقال'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-8 text-muted">جارٍ التحميل...</div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-border/20">
                <tr>
                  <th className="py-3 px-4 text-right font-semibold text-muted">العنوان</th>
                  <th className="py-3 px-4 text-right font-semibold text-muted">الحالة</th>
                  <th className="py-3 px-4 text-right font-semibold text-muted">المشاهدات</th>
                  <th className="py-3 px-4 text-right font-semibold text-muted">التاريخ</th>
                  <th className="py-3 px-4 text-right font-semibold text-muted">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.items ?? []).map((a: any) => (
                  <tr key={a.id} className="hover:bg-border/10 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-medium line-clamp-1">{a.titleAr}</p>
                      <p className="text-xs text-muted line-clamp-1">{a.titleEn}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${a.status === 'PUBLISHED' ? 'bg-success/15 text-success' : 'bg-border text-muted'}`}>
                        {a.status === 'PUBLISHED' ? '✅ منشور' : '📝 مسودة'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-muted">{a.viewCount}</td>
                    <td className="py-3 px-4 text-muted text-xs">{formatDate(a.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => openEdit(a)} className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-border/40 transition-colors">تعديل</button>
                        <button onClick={() => togglePublish(a)} className={`text-xs px-2 py-1 rounded-lg border transition-colors ${a.status === 'PUBLISHED' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-success/30 text-success hover:bg-success/5'}`}>
                          {a.status === 'PUBLISHED' ? 'إخفاء' : 'نشر'}
                        </button>
                        <button onClick={() => { if (confirm('حذف المقال؟')) deleteMutation.mutate(a.id); }}
                          className="text-xs px-2 py-1 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors">حذف</button>
                        <a href={`/articles/${a.slug}`} target="_blank" className="text-xs px-2 py-1 rounded-lg border border-border text-primary hover:bg-primary/5 transition-colors">عرض</a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(data?.items ?? []).length === 0 && (
              <div className="text-center py-10 text-muted">
                <p className="text-3xl mb-2">📰</p>
                <p>لا توجد مقالات بعد. اضغط "توليد" لإنشاء مقالات بالذكاء الاصطناعي!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Suggestions Panel ────────────────────────────────────────────────────
function SuggestionsPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-suggestions', statusFilter],
    queryFn: () => api.get(`/admin/suggestions?limit=50${statusFilter ? `&status=${statusFilter}` : ''}`).then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, adminNote }: any) => api.patch(`/admin/suggestions/${id}`, { status, adminNote }).then((r) => r.data),
    onSuccess: () => { toast.success('تم التحديث'); queryClient.invalidateQueries({ queryKey: ['admin-suggestions'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/suggestions/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('تم الحذف'); queryClient.invalidateQueries({ queryKey: ['admin-suggestions'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  return (
    <div className="space-y-5">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <p className="font-semibold">{data?.pagination?.total ?? 0} اقتراح</p>
        <div className="flex gap-1 bg-border/40 rounded-xl p-1 mr-auto">
          {[['', 'الكل'], ['PENDING', 'قيد الانتظار'], ['REVIEWED', 'مراجعة'], ['IMPLEMENTED', 'مُطبَّق'], ['REJECTED', 'مرفوض']].map(([v, l]) => (
            <button key={v as string} onClick={() => setStatusFilter(v as string)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === v ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}>
              {l as string}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted">جارٍ التحميل...</div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className="text-center py-12 text-muted">
          <p className="text-4xl mb-3">💡</p>
          <p>لا توجد مقترحات حالياً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.items ?? []).map((s: any) => (
            <div key={s.id} className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      s.status === 'PENDING' ? 'bg-amber-100 text-amber-700'
                      : s.status === 'IMPLEMENTED' ? 'bg-success/15 text-success'
                      : s.status === 'REJECTED' ? 'bg-destructive/10 text-destructive'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                      {SUGGESTION_STATUS[s.status] ?? s.status}
                    </span>
                    {s.user && <span className="text-xs text-muted">👤 {s.user.displayName}</span>}
                    {s.name && !s.user && <span className="text-xs text-muted">👤 {s.name}</span>}
                    {s.email && <span className="text-xs text-muted" dir="ltr">{s.email}</span>}
                    <span className="text-xs text-muted">{formatDate(s.createdAt)}</span>
                  </div>
                  <p className="text-sm leading-relaxed">{s.content}</p>
                  {s.adminNote && (
                    <p className="text-xs text-muted mt-2 bg-border/30 rounded-lg p-2">📝 ملاحظة الإدارة: {s.adminNote}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <select value={s.status}
                    onChange={(e) => updateMutation.mutate({ id: s.id, status: e.target.value })}
                    className="text-xs border border-border rounded-lg px-2 py-1 focus:outline-none bg-background">
                    <option value="PENDING">قيد الانتظار</option>
                    <option value="REVIEWED">تمت المراجعة</option>
                    <option value="IMPLEMENTED">مُطبَّق</option>
                    <option value="REJECTED">مرفوض</option>
                  </select>
                  <button onClick={() => { if (confirm('حذف الاقتراح؟')) deleteMutation.mutate(s.id); }}
                    className="text-xs px-2 py-1 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors">
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Ads Panel ─────────────────────────────────────────────────────────────
const AD_POSITIONS = ['HEADER_BANNER', 'DASHBOARD_BANNER', 'SIDEBAR', 'INLINE', 'FOOTER_BANNER'];
const AD_POSITION_LABELS: Record<string, string> = {
  HEADER_BANNER: '🔝 بانر علوي (كامل العرض)',
  DASHBOARD_BANNER: '📊 بانر الداشبورد',
  SIDEBAR: '📌 الشريط الجانبي',
  INLINE: '📄 داخل المحتوى',
  FOOTER_BANNER: '🔻 بانر سفلي',
};
const AD_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-success/15 text-success',
  PAUSED: 'bg-amber-100 text-amber-700',
  SCHEDULED: 'bg-blue-100 text-blue-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

const EMPTY_AD_FORM = {
  title: '', description: '', imageUrl: '', linkUrl: '', linkText: '',
  bgColor: '#1B6B4A', textColor: '#ffffff',
  position: 'HEADER_BANNER', status: 'ACTIVE', priority: '0',
  startDate: '', endDate: '',
};

function AdsPanel() {
  const queryClient = useQueryClient();
  const [posFilter, setPosFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editAd, setEditAd] = useState<any | null>(null);
  const [form, setForm] = useState({ ...EMPTY_AD_FORM });

  const { data: statsData } = useQuery({
    queryKey: ['admin-ads-stats'],
    queryFn: () => api.get('/admin/ads/stats').then((r) => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-ads', posFilter, statusFilter],
    queryFn: () =>
      api.get(`/admin/ads?limit=50${posFilter ? `&position=${posFilter}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}`).then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (d: any) =>
      editAd
        ? api.patch(`/admin/ads/${editAd.id}`, d).then((r) => r.data)
        : api.post('/admin/ads', d).then((r) => r.data),
    onSuccess: () => {
      toast.success(editAd ? 'تم تحديث الإعلان' : 'تم إنشاء الإعلان');
      queryClient.invalidateQueries({ queryKey: ['admin-ads'] });
      queryClient.invalidateQueries({ queryKey: ['admin-ads-stats'] });
      setShowForm(false); setEditAd(null); setForm({ ...EMPTY_AD_FORM });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const toggleStatus = (ad: any) =>
    api.patch(`/admin/ads/${ad.id}`, { status: ad.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' })
      .then(() => { queryClient.invalidateQueries({ queryKey: ['admin-ads'] }); queryClient.invalidateQueries({ queryKey: ['admin-ads-stats'] }); toast.success('تم التحديث'); })
      .catch(() => toast.error('حدث خطأ'));

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/ads/${id}`).then((r) => r.data),
    onSuccess: () => { toast.success('تم حذف الإعلان'); queryClient.invalidateQueries({ queryKey: ['admin-ads'] }); queryClient.invalidateQueries({ queryKey: ['admin-ads-stats'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const openEdit = (ad: any) => {
    setEditAd(ad);
    setForm({
      title: ad.title || '', description: ad.description || '',
      imageUrl: ad.imageUrl || '', linkUrl: ad.linkUrl || '', linkText: ad.linkText || '',
      bgColor: ad.bgColor || '#1B6B4A', textColor: ad.textColor || '#ffffff',
      position: ad.position || 'HEADER_BANNER', status: ad.status || 'ACTIVE',
      priority: String(ad.priority ?? 0),
      startDate: ad.startDate ? ad.startDate.slice(0, 10) : '',
      endDate: ad.endDate ? ad.endDate.slice(0, 10) : '',
    });
    setShowForm(true);
  };

  const sf = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const ctr = statsData
    ? statsData.totalImpressions > 0
      ? ((statsData.totalClicks / statsData.totalImpressions) * 100).toFixed(2)
      : '0.00'
    : null;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: '📢', label: 'إجمالي الإعلانات', value: statsData.total, color: 'bg-card border-border' },
            { icon: '✅', label: 'نشطة', value: statsData.active, color: 'bg-success/5 border-success/20' },
            { icon: '⏸️', label: 'موقوفة', value: statsData.paused, color: 'bg-amber-50 border-amber-200' },
            { icon: '👁', label: 'إجمالي المشاهدات', value: statsData.totalImpressions.toLocaleString(), color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-200' },
            { icon: '🖱️', label: `النقرات / CTR: ${ctr}%`, value: statsData.totalClicks.toLocaleString(), color: 'bg-primary/5 border-primary/20' },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl border ${s.color} p-4 text-center`}>
              <p className="text-xl mb-1">{s.icon}</p>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => { setEditAd(null); setForm({ ...EMPTY_AD_FORM }); setShowForm((s) => !s); }}
          className="btn-duo btn-duo-primary text-sm px-4 py-2"
        >
          {showForm && !editAd ? '✕ إلغاء' : '+ إعلان جديد'}
        </button>

        {/* Position filter */}
        <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)}
          className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none bg-background">
          <option value="">كل المواضع</option>
          {AD_POSITIONS.map((p) => <option key={p} value={p}>{AD_POSITION_LABELS[p]}</option>)}
        </select>

        {/* Status filter */}
        <div className="flex gap-1 bg-border/40 rounded-xl p-1">
          {[['', 'الكل'], ['ACTIVE', '✅ نشط'], ['PAUSED', '⏸️ موقوف']].map(([v, l]) => (
            <button key={v as string} onClick={() => setStatusFilter(v as string)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${statusFilter === v ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}>
              {l as string}
            </button>
          ))}
        </div>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
          <h3 className="font-bold text-base">{editAd ? '✏️ تعديل الإعلان' : '➕ إعلان جديد'}</h3>

          {/* Preview */}
          <div className="rounded-xl overflow-hidden border border-border">
            <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: form.bgColor, color: form.textColor }}>
              <span className="text-xl">📢</span>
              <div className="flex-1">
                <p className="font-bold text-sm">{form.title || 'عنوان الإعلان'}</p>
                {form.description && <p className="text-xs opacity-80">{form.description}</p>}
              </div>
              {form.linkText && (
                <span className="text-xs font-bold px-3 py-1 rounded-lg border-2"
                  style={{ borderColor: form.textColor, color: form.textColor }}>
                  {form.linkText}
                </span>
              )}
            </div>
            <p className="text-xs text-center text-muted py-1 bg-border/20">معاينة الإعلان</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              ['title', 'عنوان الإعلان *', 'text'],
              ['description', 'وصف قصير', 'text'],
              ['imageUrl', 'رابط الصورة (اختياري)', 'url'],
              ['linkUrl', 'رابط الإعلان', 'url'],
              ['linkText', 'نص الزر (مثل: اعرف أكثر)', 'text'],
              ['priority', 'الأولوية (الأعلى يظهر أولاً)', 'number'],
            ].map(([key, label, type]) => (
              <div key={key as string}>
                <label className="block text-xs font-semibold mb-1 text-muted">{label as string}</label>
                <input type={type as string} value={(form as any)[key as string]}
                  onChange={(e) => sf(key as string, e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background" />
              </div>
            ))}

            {/* Colors */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted">لون الخلفية</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.bgColor} onChange={(e) => sf('bgColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <input type="text" value={form.bgColor} onChange={(e) => sf('bgColor', e.target.value)}
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none bg-background" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted">لون النص</label>
              <div className="flex items-center gap-2">
                <input type="color" value={form.textColor} onChange={(e) => sf('textColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-border cursor-pointer" />
                <input type="text" value={form.textColor} onChange={(e) => sf('textColor', e.target.value)}
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none bg-background" />
              </div>
            </div>

            {/* Position */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted">موضع الإعلان</label>
              <select value={form.position} onChange={(e) => sf('position', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none bg-background">
                {AD_POSITIONS.map((p) => <option key={p} value={p}>{AD_POSITION_LABELS[p]}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted">الحالة</label>
              <select value={form.status} onChange={(e) => sf('status', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none bg-background">
                <option value="ACTIVE">✅ نشط</option>
                <option value="PAUSED">⏸️ موقوف</option>
                <option value="SCHEDULED">📅 مجدول</option>
              </select>
            </div>

            {/* Dates */}
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted">تاريخ البداية</label>
              <input type="date" value={form.startDate} onChange={(e) => sf('startDate', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none bg-background" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-muted">تاريخ الانتهاء</label>
              <input type="date" value={form.endDate} onChange={(e) => sf('endDate', e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm focus:outline-none bg-background" />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => saveMutation.mutate({ ...form, priority: Number(form.priority) || 0 })}
              disabled={saveMutation.isPending || !form.title.trim()}
              className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saveMutation.isPending ? 'جارٍ الحفظ...' : editAd ? 'حفظ التعديلات' : 'إنشاء الإعلان'}
            </button>
            <button onClick={() => { setShowForm(false); setEditAd(null); setForm({ ...EMPTY_AD_FORM }); }}
              className="border border-border px-4 py-2.5 rounded-xl text-sm hover:bg-border/40">إلغاء</button>
          </div>
        </div>
      )}

      {/* Ads table */}
      {isLoading ? (
        <div className="text-center py-10 text-muted">جارٍ التحميل...</div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className="text-center py-14 bg-border/20 rounded-2xl text-muted">
          <p className="text-4xl mb-3">📢</p>
          <p className="font-medium">لا توجد إعلانات حالياً</p>
          <p className="text-sm mt-1">اضغط "+ إعلان جديد" لإنشاء أول إعلان</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-border/20">
                <tr>
                  {['الإعلان', 'الموضع', 'الحالة', 'المشاهدات', 'النقرات', 'CTR', 'الأولوية', 'إجراءات'].map((h) => (
                    <th key={h} className="py-3 px-3 text-right font-semibold text-muted text-xs whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.items ?? []).map((ad: any) => {
                  const adCtr = ad.impressions > 0 ? ((ad.clickCount / ad.impressions) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={ad.id} className="hover:bg-border/10 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          {/* Color swatch */}
                          <div className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-sm"
                            style={{ backgroundColor: ad.bgColor || '#1B6B4A', color: ad.textColor || '#fff' }}>
                            📢
                          </div>
                          <div>
                            <p className="font-semibold line-clamp-1 text-sm">{ad.title}</p>
                            {ad.linkUrl && <p className="text-xs text-muted truncate max-w-32" dir="ltr">{ad.linkUrl}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs bg-border/40 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {AD_POSITION_LABELS[ad.position]?.split(' ').slice(1).join(' ') || ad.position}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${AD_STATUS_COLORS[ad.status] || 'bg-gray-100 text-gray-500'}`}>
                          {ad.status === 'ACTIVE' ? '✅ نشط' : ad.status === 'PAUSED' ? '⏸️ موقوف' : ad.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{ad.impressions.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center font-mono text-muted">{ad.clickCount.toLocaleString()}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-xs font-bold ${Number(adCtr) > 2 ? 'text-success' : Number(adCtr) > 0.5 ? 'text-amber-600' : 'text-muted'}`}>
                          {adCtr}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-muted">{ad.priority}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => openEdit(ad)}
                            className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-border/40 transition-colors">تعديل</button>
                          <button onClick={() => toggleStatus(ad)}
                            className={`text-xs px-2 py-1 rounded-lg border transition-colors ${ad.status === 'ACTIVE' ? 'border-amber-200 text-amber-600 hover:bg-amber-50' : 'border-success/30 text-success hover:bg-success/5'}`}>
                            {ad.status === 'ACTIVE' ? 'إيقاف' : 'تفعيل'}
                          </button>
                          <button onClick={() => { if (confirm('حذف الإعلان؟')) deleteMutation.mutate(ad.id); }}
                            className="text-xs px-2 py-1 rounded-lg border border-destructive/20 text-destructive hover:bg-destructive/5 transition-colors">حذف</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
type Tab = 'stats' | 'users' | 'ads' | 'articles' | 'suggestions' | 'settings';

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>('stats');
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
    queryFn: () => api.get('/admin/users', { params: { page, limit, ...(search ? { search } : {}) } }).then((r) => r.data),
    enabled: activeTab === 'users',
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) =>
      api.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
    onSuccess: () => { toast.success('تم تحديث الدور'); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
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
    if (!confirm(`هل تريد حذف "${name}" نهائياً؟`)) return;
    deleteUserMutation.mutate(id);
  };

  const pagination = usersData?.pagination;
  const tabs: [Tab, string][] = [
    ['stats', '📊 إحصائيات'],
    ['users', '👥 المستخدمون'],
    ['ads', '📢 الإعلانات'],
    ['articles', '📰 المقالات'],
    ['suggestions', '💡 المقترحات'],
    ['settings', '⚙️ الإعدادات'],
  ];

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <h1 className="text-2xl font-bold">لوحة الإدارة</h1>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon="👤" label="المستخدمون" value={stats.totalUsers} />
          <StatCard icon="📖" label="الختمات النشطة" value={stats.activeKhatmas} />
          <StatCard icon="✅" label="الأجزاء المكتملة" value={stats.completedParts} />
          <StatCard icon="🎉" label="الختمات المكتملة" value={stats.completedKhatmas} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-border/40 rounded-xl p-1 w-fit flex-wrap">
        {tabs.map(([v, l]) => (
          <button key={v} onClick={() => setActiveTab(v)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === v ? 'bg-card text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}>
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
                className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48 bg-background" />
              <button type="submit" className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold">بحث</button>
              {search && <button type="button" onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="border border-border rounded-lg px-3 py-2 text-sm hover:bg-border/40">مسح</button>}
            </form>
          </div>
          {usersLoading ? <div className="py-8 text-center text-muted">جارٍ التحميل...</div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted text-right">
                    {['الاسم', 'البريد', 'الدور', 'مُفعَّل', 'الختمات', 'التاريخ', 'إجراءات'].map((h) => (
                      <th key={h} className="py-2 px-3 font-medium">{h}</th>
                    ))}
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
                      <td className="py-2.5 px-3">{u.emailVerified ? <span className="text-green-600 font-medium">نعم</span> : <span className="text-red-500">لا</span>}</td>
                      <td className="py-2.5 px-3 text-center">{u.khatmaCount}</td>
                      <td className="py-2.5 px-3 text-muted">{formatDate(u.createdAt)}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <select value={u.role} onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                            disabled={u.id === user?.id}
                            className="border border-border rounded-lg px-2 py-1 text-xs focus:outline-none bg-background disabled:opacity-50">
                            <option value="USER">مستخدم</option>
                            <option value="MODERATOR">ناظم</option>
                            <option value="ADMIN">مشرف</option>
                            <option value="SUPER_ADMIN">مدير عام</option>
                          </select>
                          <button onClick={() => handleDelete(u.id, u.displayName)} disabled={u.id === user?.id}
                            className="text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1 text-xs font-medium transition-colors disabled:opacity-30">حذف</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {usersData?.items?.length === 0 && <div className="py-8 text-center text-muted">لا يوجد مستخدمون</div>}
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

      {activeTab === 'ads' && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-lg mb-5">📢 إدارة الإعلانات</h2>
          <AdsPanel />
        </div>
      )}

      {activeTab === 'articles' && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-lg mb-5">📰 إدارة المقالات</h2>
          <ArticlesPanel />
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-lg mb-5">💡 المقترحات من المستخدمين</h2>
          <SuggestionsPanel />
        </div>
      )}

      {activeTab === 'settings' && <SettingsPanel />}
    </div>
  );
}
