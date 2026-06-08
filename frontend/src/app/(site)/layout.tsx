'use client';

import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import { useLangStore } from '@/store/langStore';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const lang = useLangStore((s) => s.lang);
  return (
    <div className="min-h-screen flex flex-col bg-background" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Full-width ad banner above nav */}
      <AdBanner position="HEADER_BANNER" page="public" />
      <PublicNav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
