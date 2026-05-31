'use client';

import { useState } from 'react';
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-border rounded-2xl p-5 text-center">
      <p className="text-3xl font-bold text-primary">{value}</p>
      <p className="text-sm text-muted mt-1">{label}</p>
    </div>
  );
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleDelete = (id: string, name: string) => {
    if (id === user?.id) {
      toast.error('لا يمكنك حذف حسابك الخاص');
      return;
    }
    if (!confirm(`هل تريد حذف المستخدم "${name}" نهائياً؟`)) return;
    deleteUserMutation.mutate(id);
  };

  const pagination = usersData?.pagination;

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/profile" className="text-sm text-muted hover:text-foreground transition-colors">
          ← الملف الشخصي
        </Link>
      </div>

      <h1 className="text-2xl font-bold">لوحة الإدارة</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="إجمالي المستخدمين" value={stats.totalUsers} />
          <StatCard label="الختمات النشطة" value={stats.activeKhatmas} />
          <StatCard label="الأجزاء المكتملة" value={stats.completedParts} />
          <StatCard label="الختمات المكتملة" value={stats.completedKhatmas} />
        </div>
      )}

      {/* Users table */}
      <div className="bg-white border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="font-semibold text-lg">إدارة المستخدمين</h2>
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
            />
            <button
              type="submit"
              className="bg-primary text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              بحث
            </button>
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
                className="border border-border rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
              >
                مسح
              </button>
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
                  <th className="py-2 px-3 font-medium">الحساب مُفعّل</th>
                  <th className="py-2 px-3 font-medium">الختمات</th>
                  <th className="py-2 px-3 font-medium">تاريخ الإنشاء</th>
                  <th className="py-2 px-3 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {usersData?.items?.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium">{u.displayName}</td>
                    <td className="py-2.5 px-3 text-muted" dir="ltr">{u.email ?? '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-gray-100 text-gray-700'}`}>
                        {ROLE_LABELS[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {u.emailVerified
                        ? <span className="text-green-600 font-medium">نعم</span>
                        : <span className="text-red-500">لا</span>}
                    </td>
                    <td className="py-2.5 px-3 text-center">{u.khatmaCount}</td>
                    <td className="py-2.5 px-3 text-muted">{formatDate(u.createdAt)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) => updateRoleMutation.mutate({ id: u.id, role: e.target.value })}
                          disabled={u.id === user?.id || updateRoleMutation.isPending}
                          className="border border-border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                        >
                          <option value="USER">مستخدم</option>
                          <option value="MODERATOR">ناظم</option>
                          <option value="ADMIN">مشرف</option>
                          <option value="SUPER_ADMIN">مدير عام</option>
                        </select>
                        <button
                          onClick={() => handleDelete(u.id, u.displayName)}
                          disabled={u.id === user?.id || deleteUserMutation.isPending}
                          className="text-destructive hover:bg-destructive/10 rounded-lg px-2 py-1 text-xs font-medium transition-colors disabled:opacity-30"
                        >
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

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted">
              {pagination.total} مستخدم — صفحة {pagination.page} من {pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="border border-border rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                السابق
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={!pagination.hasNextPage}
                className="border border-border rounded-lg px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-gray-50"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
