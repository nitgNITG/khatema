'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import NotificationBell from '@/components/NotificationBell';
import ThemeToggle from '@/components/ThemeToggle';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    clearAuth();
    router.push('/login');
  };

  const initials = user?.displayName?.slice(0, 2) ?? '؟';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold text-primary">ختمة</Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <NotificationBell />
            <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
                {initials}
              </div>
            )}
            <span className="text-sm font-medium hidden sm:block">{user?.displayName}</span>
          </Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
