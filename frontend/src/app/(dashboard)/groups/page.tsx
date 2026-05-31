'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function GroupCard({ g, isMine, onJoin, joining }: {
  g: any;
  isMine?: boolean;
  onJoin?: (id: string) => void;
  joining?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-3 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/groups/${g.id}`} className="font-semibold line-clamp-1 hover:text-primary transition-colors">
          {g.name}
        </Link>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          g.visibility === 'PUBLIC' ? 'bg-green-100 text-green-700'
          : g.visibility === 'PRIVATE' ? 'bg-gray-100 text-gray-600'
          : 'bg-amber-100 text-amber-700'
        }`}>
          {g.visibility === 'PUBLIC' ? 'عامة' : g.visibility === 'PRIVATE' ? 'خاصة' : 'بالدعوة'}
        </span>
      </div>

      {g.description && (
        <p className="text-sm text-muted line-clamp-2">{g.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-muted">
        <span>👥 {g.memberCount ?? 0} عضو</span>
        {g.creator && <span className="text-xs">بواسطة {g.creator.displayName}</span>}
      </div>

      {isMine && (
        <div className="flex gap-1">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            g.myRole === 'OWNER' ? 'bg-primary/10 text-primary'
            : g.myRole === 'ADMIN' ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-600'
          }`}>
            {g.myRole === 'OWNER' ? 'منشئ' : g.myRole === 'ADMIN' ? 'مشرف' : 'عضو'}
          </span>
        </div>
      )}

      {!isMine && onJoin && g.visibility === 'PUBLIC' && (
        <button
          onClick={() => onJoin(g.id)}
          disabled={joining}
          className="w-full border border-primary text-primary rounded-xl py-2 text-sm font-semibold hover:bg-primary/5 disabled:opacity-50 transition-colors"
        >
          {joining ? 'جارٍ الانضمام...' : 'انضم للمجموعة'}
        </button>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

export default function GroupsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'mine' | 'discover'>('mine');
  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [page, setPage] = useState(1);
  const [showJoinCode, setShowJoinCode] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => { setSearchQ(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: myGroups, isLoading: loadingMine } = useQuery({
    queryKey: ['my-groups'],
    queryFn: () => api.get('/groups/mine').then((r) => r.data),
  });

  const discoverParams = new URLSearchParams({
    limit: '8', page: String(page),
    ...(searchQ && { q: searchQ }),
  });

  const { data: publicData, isLoading: loadingPublic, isFetching } = useQuery({
    queryKey: ['public-groups', searchQ, page],
    queryFn: () => api.get(`/groups?${discoverParams}`).then((r) => r.data),
    enabled: tab === 'discover',
  });

  const myGroupIds = new Set((myGroups ?? []).map((g: any) => g.id));
  const discoverItems = (publicData?.items ?? []).filter((g: any) => !myGroupIds.has(g.id));
  const totalPages = publicData?.pagination?.totalPages ?? 1;

  const joinMutation = useMutation({
    mutationFn: (groupId: string) => api.post(`/groups/${groupId}/join`).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.status === 'PENDING' ? 'تم إرسال طلب الانضمام' : 'انضممت للمجموعة!');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
      queryClient.invalidateQueries({ queryKey: ['public-groups'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'حدث خطأ'),
  });

  const joinByCodeMutation = useMutation({
    mutationFn: (code: string) => api.post('/groups/join-by-code', { inviteCode: code }).then((r) => r.data),
    onSuccess: (res) => {
      toast.success(res.status === 'PENDING' ? 'تم إرسال طلب الانضمام' : 'انضممت للمجموعة!');
      setShowJoinCode(false);
      setInviteCodeInput('');
      queryClient.invalidateQueries({ queryKey: ['my-groups'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'رمز الدعوة غير صحيح'),
  });

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">المجموعات</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinCode(true)}
            className="border border-primary text-primary px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/5 transition-colors"
          >
            🔗 انضم برمز
          </button>
          <Link href="/groups/new" className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            + مجموعة جديدة
          </Link>
        </div>
      </div>

      {/* Join by invite code modal */}
      {showJoinCode && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-lg">انضم برمز الدعوة</h3>
            <input
              type="text"
              value={inviteCodeInput}
              onChange={(e) => setInviteCodeInput(e.target.value)}
              placeholder="أدخل رمز الدعوة..."
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => e.key === 'Enter' && inviteCodeInput && joinByCodeMutation.mutate(inviteCodeInput)}
            />
            <div className="flex gap-2">
              <button
                onClick={() => joinByCodeMutation.mutate(inviteCodeInput)}
                disabled={!inviteCodeInput || joinByCodeMutation.isPending}
                className="flex-1 bg-primary text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {joinByCodeMutation.isPending ? 'جارٍ الانضمام...' : 'انضم'}
              </button>
              <button
                onClick={() => { setShowJoinCode(false); setInviteCodeInput(''); }}
                className="px-4 border border-border rounded-xl text-sm font-semibold"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {([['mine', 'مجموعاتي'] , ['discover', 'اكتشف']] as [typeof tab, string][]).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === v ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* My Groups Tab */}
      {tab === 'mine' && (
        <section>
          {loadingMine ? (
            <SkeletonGrid />
          ) : !myGroups || myGroups.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl text-muted">
              <p className="text-3xl mb-3">👥</p>
              <p className="font-medium">لم تنضم لأي مجموعة بعد</p>
              <p className="text-sm mt-1">أنشئ مجموعة أو اكتشف المجموعات العامة</p>
              <div className="flex justify-center gap-3 mt-4">
                <button
                  onClick={() => setTab('discover')}
                  className="border border-primary text-primary px-5 py-2 rounded-xl text-sm font-semibold hover:bg-primary/5"
                >
                  اكتشف
                </button>
                <Link href="/groups/new" className="bg-primary text-white px-5 py-2 rounded-xl text-sm font-semibold">
                  إنشاء مجموعة
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {myGroups.map((g: any) => <GroupCard key={g.id} g={g} isMine />)}
            </div>
          )}
        </section>
      )}

      {/* Discover Tab */}
      {tab === 'discover' && (
        <section className="space-y-4">
          <div className="relative">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="ابحث باسم المجموعة..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border border-border rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>

          {loadingPublic ? (
            <SkeletonGrid />
          ) : discoverItems.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-2xl text-muted">
              <p className="text-2xl mb-2">🔍</p>
              <p className="font-medium">
                {searchQ ? `لا نتائج لـ "${searchQ}"` : 'لا توجد مجموعات عامة حالياً'}
              </p>
            </div>
          ) : (
            <>
              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
                {discoverItems.map((g: any) => (
                  <GroupCard
                    key={g.id} g={g}
                    onJoin={(id) => joinMutation.mutate(id)}
                    joining={joinMutation.isPending && joinMutation.variables === g.id}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isFetching}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-gray-50">← السابق</button>
                  <span className="text-sm text-muted">{page} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || isFetching}
                    className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-gray-50">التالي →</button>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
