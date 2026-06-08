'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/store/langStore';

export default function Footer() {
  const { t } = useT();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-card">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Top row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex flex-col items-center sm:items-start gap-1">
            <span className="text-2xl font-extrabold text-primary">ختمة</span>
            <p className="text-xs text-muted">{t('tagline')}</p>
          </div>

          {/* NITG Credit */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-xs text-muted">{t('implementedBy')}</p>
            <Link
              href="https://nitg-eg.com/ar"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
            >
              {/* Fixed logo: 412×350 → display at ~56×48 */}
              <div className="relative w-14 h-12 shrink-0">
                <Image
                  src="/nitg-logo.avif"
                  alt="NITG"
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground leading-tight">{t('nitgName')}</p>
                <p className="text-xs text-muted">nitg-eg.com</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-5" />

        {/* Bottom row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted">
          <p>{t('allRightsReserved')} © {year} ختمة</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-primary transition-colors">{t('privacy')}</Link>
            <Link href="/terms" className="hover:text-primary transition-colors">{t('terms')}</Link>
            <Link href="https://nitg-eg.com/ar" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              nitg-eg.com
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
