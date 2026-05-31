'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function KhatmaCard({ k, showJoin, joinDisabled, joinDisabledReason, onJoin, joining }: {
  k: any;
  showJoin?: boolean;
  joinDisabled?: boolean;
  joinDisabledReason?: string;
  onJoin?: (id: string) => void;
  joining?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 space-y-3 hover:border-primary/30 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/khatma/${k.id}`} className="font-semibold line-clamp-1 hover:text-primary transition-colors">
          {k.title}
        </Link>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
          k.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {k.status === 'COMPLETED' ? 'مكتملة' : 'نشطة'}
        </span>
      </div>

      {k.creator && (
        <p className="text-xs text-muted">بواسطة {k.creator.displayName}</p>
      )}

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${k.completionPercentage}%` }}
        />
      </div>

      <div className="flex justify-between items-center text-sm text-muted">
        <span>{k.completionPercentage}% مكتمل</span>
        <span>{k.participantCount} مشارك</span>
      </div>

      {showJoin && (
        <button
          onClick={() => !joinDisabled && onJoin?.(k.id)}
          disabled={joining || joinDisabled}
          title={joinDisabled ? joinDisabledReason : undefined}
          className={`w-full mt-1 rounded-xl py-2 text-sm font-semibold transition-colors ${
            joinDisabled
              ? 'border border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
              : 'border border-primary text-primary hover:bg-primary/5 disabled:opacity-50'
          }`}
        >
          {joining ? 'جارٍ الانضمام...' : joinDisabled ? 'وصلت للحد الأقصى' : 'انضم للختمة'}
        </button>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-36 bg-gray-100 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

type StatusFilter = 'ACTIVE' | 'COMPLETED' | '';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [discoverPage, setDiscoverPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQ(searchInput);
      setDiscoverPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data: myKhatmas, isLoading: loadingMine } = useQuery({
    queryKey: ['my-khatmas'],
    queryFn: () => api.get('/users/me/khatmas').then((r) => r.data),
  });

  const discoverParams = new URLSearchParams({
    visibility: 'PUBLIC',
    limit: '8',
    page: String(discoverPage),
    ...(statusFilter && { status: statusFilter }),
    ...(searchQ && { q: searchQ }),
  });

  const { data: publicData, isLoading: loadingPublic, isFetching } = useQuery({
    queryKey: ['public-khatmas', statusFilter, searchQ, discoverPage],
    queryFn: () => api.get(`/khatmas?${discoverParams}`).then((r) => r.data),
  });

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/users/me').then((r) => r.data),
  });

  const joinMutation = useMutation({
    mutationFn: (khatmaId: string) =>
      api.post(`/khatmas/${khatmaId}/join`, {}).then((r) => r.data),
    onSuccess: (res) => {
      if (res.status === 'PENDING') {
        toast.success('تم إرسال طلب الانضمام، بانتظار الموافقة');
      } else {
        toast.success('انضممت للختمة!');
      }
      queryClient.invalidateQueries({ queryKey: ['my-khatmas'] });
      queryClient.invalidateQueries({ queryKey: ['public-khatmas'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'حدث خطأ');
    },
  });

  const myIds = new Set((myKhatmas ?? []).map((k: any) => k.id));
  const discoverItems = (publicData?.items ?? []).filter((k: any) => !myIds.has(k.id));
  const totalPages = publicData?.pagination?.totalPages ?? 1;

  const activeCollective = (myKhatmas ?? []).filter((k: any) => k.type === 'COLLECTIVE' && k.status === 'ACTIVE').length;
  const activeIndividual = (myKhatmas ?? []).filter((k: any) => k.type === 'INDIVIDUAL' && k.status === 'ACTIVE').length;
  const maxCollective = profile?.maxCollectiveKhatmas ?? 1;
  const maxIndividual = profile?.maxIndividualKhatmas ?? 1;
  const atCollectiveLimit = activeCollective >= maxCollective;
  const atBothLimits = atCollectiveLimit && activeIndividual >= maxIndividual;

  const limitTooltip = atBothLimits
    ? `وصلت للحد الأقصى (${maxCollective} جماعية، ${maxIndividual} فردية). غيّر الحد من بروفايلك`
    : atCollectiveLimit
      ? `وصلت لحد الختمات الجماعية (${maxCollective}). يمكنك إنشاء ختمة فردية فقط`
      : activeIndividual >= maxIndividual
        ? `وصلت لحد الختمات الفردية (${maxIndividual}). يمكنك إنشاء ختمة جماعية فقط`
        : '';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">مرحباً، {user?.displayName} 👋</h1>
        {atBothLimits ? (
          <span title={limitTooltip} className="bg-gray-200 text-gray-400 px-5 py-2.5 rounded-xl font-semibold cursor-not-allowed select-none">
            + ختمة جديدة
          </span>
        ) : (
          <Link href="/khatma/new" title={limitTooltip || undefined}
            className="bg-primary text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            + ختمة جديدة
          </Link>
        )}
      </div>

      {/* My Khatmas */}
      <section>
        <h2 className="text-lg font-semibold mb-4">ختماتي</h2>
        {loadingMine ? (
          <SkeletonGrid />
        ) : !myKhatmas || myKhatmas.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl text-muted">
            <p className="text-3xl mb-3">📖</p>
            <p className="font-medium">لم تنضم لأي ختمة بعد</p>
            <p className="text-sm mt-1">أنشئ ختمة أو انضم لختمة من القائمة أدناه</p>
            <Link href="/khatma/new" className="mt-4 inline-block bg-primary text-white px-6 py-2.5 rounded-xl font-semibold text-sm">
              إنشاء ختمة
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myKhatmas.map((k: any) => <KhatmaCard key={k.id} k={k} />)}
          </div>
        )}
      </section>

      {/* Discover */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-lg font-semibold">اكتشف الختمات</h2>
          <Link href="/groups" className="text-sm text-primary font-medium hover:underline">
            👥 مجموعاتي
          </Link>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="ابحث باسم الختمة..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border border-border rounded-xl pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {([['', 'الكل'], ['ACTIVE', 'نشطة'], ['COMPLETED', 'مكتملة']] as [StatusFilter, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setStatusFilter(val); setDiscoverPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === val ? 'bg-white text-foreground shadow-sm' : 'text-muted hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {loadingPublic ? (
          <SkeletonGrid />
        ) : discoverItems.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 rounded-2xl text-muted">
            <p className="text-2xl mb-2">🔍</p>
            <p className="font-medium">
              {searchQ ? `لا نتائج لـ "${searchQ}"` : 'لا توجد ختمات عامة حالياً'}
            </p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {discoverItems.map((k: any) => (
                <KhatmaCard
                  key={k.id} k={k} showJoin
                  joinDisabled={atCollectiveLimit}
                  joinDisabledReason={`وصلت لحد الختمات الجماعية (${maxCollective})`}
                  onJoin={(id) => joinMutation.mutate(id)}
                  joining={joinMutation.isPending && joinMutation.variables === k.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => setDiscoverPage((p) => Math.max(1, p - 1))}
                  disabled={discoverPage === 1 || isFetching}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  ← السابق
                </button>
                <span className="text-sm text-muted">{discoverPage} / {totalPages}</span>
                <button
                  onClick={() => setDiscoverPage((p) => Math.min(totalPages, p + 1))}
                  disabled={discoverPage === totalPages || isFetching}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm disabled:opacity-40 hover:bg-gray-50"
                >
                  التالي →
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
