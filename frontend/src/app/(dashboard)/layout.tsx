'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import Image from 'next/image';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';
import LangToggle from '@/components/LangToggle';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import { useT } from '@/store/langStore';

const NAV_LINKS = [
  { href: '/dashboard', labelKey: 'dashboard' as const, icon: '🏠' },
  { href: '/articles',  labelKey: 'articles'  as const, icon: '📰' },
  { href: '/about',     labelKey: 'about'     as const, icon: '🌿' },
  { href: '/suggestions',labelKey:'suggestions'as const, icon: '💡' },
  { href: '/contact',   labelKey: 'contact'   as const, icon: '📬' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useT();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/login');
  };

  const initials = user?.displayName?.slice(0, 2) ?? '؟';

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* ── Ad banner (above header, not sticky) ── */}
      <AdBanner position="HEADER_BANNER" page="dashboard" />

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border">
        {/* ── Top bar: logo + actions ── */}
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand + NITG logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="relative w-9 h-8 shrink-0">
              <Image src="/nitg-logo.avif" alt="NITG" fill className="object-contain" unoptimized />
            </div>
            <span className="text-xl font-extrabold text-primary">ختمة</span>
          </Link>

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            {user?.role === 'SUPER_ADMIN' && (
              <Link
                href="/admin"
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === '/admin'
                    ? 'bg-red-200 text-red-800'
                    : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 hover:bg-red-200'
                }`}
              >
                ⚙️ Admin
              </Link>
            )}
            <LangToggle />
            <ThemeToggle />
            <NotificationBell />
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity mr-1">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.displayName}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold ring-2 ring-primary/20">
                  {initials}
                </div>
              )}
              <span className="text-sm font-semibold hidden sm:block">{user?.displayName}</span>
            </Link>
          </div>
        </div>

        {/* ── Navigation links row ── */}
        <div className="border-t border-border/60">
          <nav className="max-w-5xl mx-auto px-4 flex items-center gap-1 overflow-x-auto scrollbar-hide h-10">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <span className="text-xs">{link.icon}</span>
                  <span>{t(link.labelKey)}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <Footer />
    </div>
  );
}
