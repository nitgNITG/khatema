'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/store/langStore';

/* ── Khatma card ── */
function KhatmaCard({ k, showJoin, joinDisabled, joinDisabledReason, onJoin, joining }: {
  k: any;
  showJoin?: boolean;
  joinDisabled?: boolean;
  joinDisabledReason?: string;
  onJoin?: (id: string) => void;
  joining?: boolean;
}) {
  const { t, isAr } = useT();
  const pct = k.completionPercentage ?? 0;
  const isCompleted = k.status === 'COMPLETED';

  return (
    <div className="card-lift bg-card rounded-2xl border border-border p-5 space-y-3 hover:border-primary/40 transition-all">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/khatma/${k.id}`} className="font-bold line-clamp-1 hover:text-primary transition-colors">
          {k.title}
        </Link>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${
          isCompleted
            ? 'bg-success/15 text-success'
            : 'bg-primary/10 text-primary'
        }`}>
          {isCompleted ? `✅ ${t('completed')}` : `🔵 ${t('active')}`}
        </span>
      </div>

      {k.creator && (
        <p className="text-xs text-muted">{isAr ? 'بواسطة' : 'by'} {k.creator.displayName}</p>
      )}

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted">
          <span>{t('progress')}</span>
          <span className="font-bold text-primary">{pct}%</span>
        </div>
        <div className="h-2.5 bg-border rounded-full overflow-hidden">
          <div
            className="progress-bar h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: isCompleted
                ? 'var(--success)'
                : 'linear-gradient(to left, var(--primary), var(--secondary))',
            }}
          />
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-muted">
        <span>👥 {k.participantCount ?? 0} {t('participants')}</span>
        <span>{k.type === 'COLLECTIVE' ? t('collective') : t('individual')}</span>
      </div>

      {showJoin && (
        <button
          onClick={() => !joinDisabled && onJoin?.(k.id)}
          disabled={joining || joinDisabled}
          title={joinDisabled ? joinDisabledReason : undefined}
          className={`w-full mt-1 rounded-xl py-2.5 text-sm font-bold transition-all ${
            joinDisabled
              ? 'bg-border/50 text-muted cursor-not-allowed'
              : 'btn-duo btn-duo-outline border-primary text-primary hover:bg-primary/5 disabled:opacity-50'
          }`}
        >
          {joining ? t('joining') : joinDisabled ? t('reachedLimit') : t('joinKhatma')}
        </button>
      )}
    </div>
  );
}

/* ── Stat card ── */
function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string | number; color: string }) {
  return (
    <div className={`card-lift rounded-2xl border p-5 flex items-center gap-4 ${color}`}>
      <div className="text-3xl">{icon}</div>
      <div>
        <p className="text-2xl font-extrabold">{value}</p>
        <p className="text-xs text-muted mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-40 bg-border/50 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
}

type StatusFilter = 'ACTIVE' | 'COMPLETED' | '';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { t, isAr } = useT();

  const [searchInput, setSearchInput] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [discoverPage, setDiscoverPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQ(searchInput);
      setDiscoverPage(1);
    }, 350);
    return () => clearTimeout(timer);
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
    mutationFn: (khatmaId: string) => api.post(`/khatmas/${khatmaId}/join`, {}).then((r) => r.data),
    onSuccess: (res) => {
      if (res.status === 'PENDING') {
        toast.success(isAr ? 'تم إرسال طلب الانضمام، بانتظار الموافقة' : 'Join request sent, awaiting approval');
      } else {
        toast.success(isAr ? 'انضممت للختمة! 🎉' : 'Joined the khatma! 🎉');
      }
      queryClient.invalidateQueries({ queryKey: ['my-khatmas'] });
      queryClient.invalidateQueries({ queryKey: ['public-khatmas'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || (isAr ? 'حدث خطأ' : 'An error occurred')),
  });

  const myIds = new Set((myKhatmas ?? []).map((k: any) => k.id));
  const discoverItems = (publicData?.items ?? []).filter((k: any) => !myIds.has(k.id));
  const totalPages = publicData?.pagination?.totalPages ?? 1;

  const activeCollective = (myKhatmas ?? []).filter((k: any) => k.type === 'COLLECTIVE' && k.status === 'ACTIVE').length;
  const activeIndividual = (myKhatmas ?? []).filter((k: any) => k.type === 'INDIVIDUAL' && k.status === 'ACTIVE').length;
  const completedCount = (myKhatmas ?? []).filter((k: any) => k.status === 'COMPLETED').length;
  const totalCount = (myKhatmas ?? []).length;

  const maxCollective = profile?.maxCollectiveKhatmas ?? 1;
  const maxIndividual = profile?.maxIndividualKhatmas ?? 1;
  const atCollectiveLimit = activeCollective >= maxCollective;
  const atBothLimits = atCollectiveLimit && activeIndividual >= maxIndividual;

  const limitTooltip = atBothLimits
    ? (isAr ? `وصلت للحد الأقصى (${maxCollective} جماعية، ${maxIndividual} فردية)` : `Reached limit (${maxCollective} collective, ${maxIndividual} individual)`)
    : atCollectiveLimit
      ? (isAr ? `وصلت لحد الختمات الجماعية (${maxCollective})` : `Reached collective limit (${maxCollective})`)
      : activeIndividual >= maxIndividual
        ? (isAr ? `وصلت لحد الختمات الفردية (${maxIndividual})` : `Reached individual limit (${maxIndividual})`)
        : '';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('goodMorning') : hour < 17 ? t('goodAfternoon') : t('goodEvening');

  // Replace {count} placeholder in hasActiveKhatmas
  const activeCountText = t('hasActiveKhatmas').replace('{count}', String(activeCollective + activeIndividual));

  const statusOptions: [StatusFilter, string][] = [
    ['', t('all')],
    ['ACTIVE', t('active')],
    ['COMPLETED', t('completed')],
  ];

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8 pb-16">

      {/* ── Welcome banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-8 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full" />
        <div className="relative flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-white/80 text-sm">{greeting}،</p>
            <h1 className="text-2xl font-extrabold mt-0.5">{user?.displayName} 👋</h1>
            <p className="text-white/70 text-sm mt-1">
              {totalCount === 0 ? t('startFirstKhatma') : activeCountText}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/groups" className="btn-duo btn-duo-ghost !text-white !border-white/30 text-sm px-4 py-2">
              👥 {t('groups')}
            </Link>
            {atBothLimits ? (
              <span title={limitTooltip} className="btn-duo bg-white/20 text-white border-white/10 text-sm px-5 py-2 cursor-not-allowed select-none">
                + {isAr ? 'ختمة' : 'Khatma'}
              </span>
            ) : (
              <Link href="/khatma/new" title={limitTooltip || undefined} className="btn-duo bg-white text-primary border-white/50 font-bold text-sm px-5 py-2">
                + {t('newKhatma')}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      {!loadingMine && (myKhatmas ?? []).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon="📖" label={t('totalKhatmas')} value={totalCount} color="bg-card border-border" />
          <StatCard icon="🔵" label={t('activeNow')} value={activeCollective + activeIndividual} color="bg-primary/5 border-primary/20" />
          <StatCard icon="✅" label={t('completed')} value={completedCount} color="bg-success/5 border-success/20" />
          <StatCard icon="🤝" label={t('collectiveActive')} value={activeCollective} color="bg-secondary/5 border-secondary/20" />
        </div>
      )}

      {/* ── My Khatmas ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('myKhatmas')}</h2>
          {!atBothLimits && (
            <Link href="/khatma/new" className="text-sm text-primary font-semibold hover:underline">
              + {isAr ? 'إضافة' : 'Add'}
            </Link>
          )}
        </div>

        {loadingMine ? (
          <SkeletonGrid />
        ) : !myKhatmas || myKhatmas.length === 0 ? (
          <div className="text-center py-14 bg-card border border-dashed border-border rounded-3xl text-muted">
            <p className="text-5xl mb-4">📖</p>
            <p className="font-bold text-lg text-foreground mb-1">{t('noKhatmasYet')}</p>
            <p className="text-sm mb-5">{t('noKhatmasHint')}</p>
            <Link href="/khatma/new" className="btn-duo btn-duo-primary text-sm px-6 py-2.5">
              {t('createKhatma')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myKhatmas.map((k: any) => <KhatmaCard key={k.id} k={k} />)}
          </div>
        )}
      </section>

      {/* ── Discover ── */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="text-lg font-bold">{t('discoverKhatmas')} 🌐</h2>
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <svg className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder={t('searchKhatma')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full border border-border bg-card rounded-xl pr-10 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
            />
          </div>
          <div className="flex gap-1 bg-border/40 rounded-xl p-1">
            {statusOptions.map(([val, label]) => (
              <button
                key={val}
                onClick={() => { setStatusFilter(val); setDiscoverPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  statusFilter === val
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted hover:text-foreground'
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
          <div className="text-center py-12 bg-card border border-dashed border-border rounded-3xl text-muted">
            <p className="text-4xl mb-3">{searchQ ? '🔍' : '🌙'}</p>
            <p className="font-medium">
              {searchQ
                ? `${t('noResults')} "${searchQ}"`
                : t('noPublicKhatmas')}
            </p>
          </div>
        ) : (
          <>
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-opacity duration-200 ${isFetching ? 'opacity-60' : 'opacity-100'}`}>
              {discoverItems.map((k: any) => (
                <KhatmaCard
                  key={k.id} k={k} showJoin
                  joinDisabled={atCollectiveLimit}
                  joinDisabledReason={isAr ? `وصلت لحد الختمات الجماعية (${maxCollective})` : `Reached collective limit (${maxCollective})`}
                  onJoin={(id) => joinMutation.mutate(id)}
                  joining={joinMutation.isPending && joinMutation.variables === k.id}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setDiscoverPage((p) => Math.max(1, p - 1))}
                  disabled={discoverPage === 1 || isFetching}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-semibold disabled:opacity-40 hover:bg-border/40 transition-colors"
                >
                  {t('prev')}
                </button>
                <span className="text-sm text-muted font-medium">{discoverPage} / {totalPages}</span>
                <button
                  onClick={() => setDiscoverPage((p) => Math.min(totalPages, p + 1))}
                  disabled={discoverPage === totalPages || isFetching}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-semibold disabled:opacity-40 hover:bg-border/40 transition-colors"
                >
                  {t('next')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
