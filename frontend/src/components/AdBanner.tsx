'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '@/lib/api';

interface Ad {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  linkText?: string;
  bgColor?: string;
  textColor?: string;
}

interface Props {
  position?: string;
  /** Which page is showing this — used for session-dismiss key */
  page?: string;
}

export default function AdBanner({ position = 'HEADER_BANNER', page = 'home' }: Props) {
  const dismissKey = `ad-dismissed-${page}`;
  const [dismissed, setDismissed] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);

  // Restore dismiss state from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDismissed(sessionStorage.getItem(dismissKey) === '1');
    }
  }, [dismissKey]);

  const { data: ads = [] } = useQuery<Ad[]>({
    queryKey: ['ads', position],
    queryFn: () => api.get(`/ads?position=${position}`).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Auto-rotate every 6 seconds when there are multiple ads
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((i) => (i + 1) % ads.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [ads.length]);

  // Record impression when ad is shown
  useEffect(() => {
    const ad = ads[currentIdx];
    if (ad && !dismissed) {
      api.post(`/ads/${ad.id}/impression`).catch(() => {});
    }
  }, [currentIdx, ads, dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== 'undefined') sessionStorage.setItem(dismissKey, '1');
  };

  const handleClick = useCallback(async (ad: Ad) => {
    try { await api.post(`/ads/${ad.id}/click`); } catch {}
    if (ad.linkUrl) window.open(ad.linkUrl, '_blank', 'noopener noreferrer');
  }, []);

  if (dismissed || ads.length === 0) return null;

  const ad = ads[currentIdx];
  const bg = ad.bgColor || '#1B6B4A';
  const fg = ad.textColor || '#ffffff';

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: bg, color: fg }}
    >
      {/* Main banner content */}
      <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-4">
        {/* Ad icon / image */}
        {ad.imageUrl ? (
          <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden">
            <Image src={ad.imageUrl} alt={ad.title} fill className="object-cover" unoptimized />
          </div>
        ) : (
          <span className="text-2xl shrink-0">📢</span>
        )}

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{ad.title}</p>
          {ad.description && (
            <p className="text-xs opacity-80 truncate">{ad.description}</p>
          )}
        </div>

        {/* CTA button */}
        {ad.linkUrl && (
          <button
            onClick={() => handleClick(ad)}
            className="shrink-0 text-xs font-bold px-4 py-1.5 rounded-lg border-2 hover:opacity-90 transition-opacity"
            style={{ borderColor: fg, color: fg }}
          >
            {ad.linkText || (fg === '#ffffff' ? 'اعرف أكثر' : 'Learn More')}
          </button>
        )}

        {/* Dot pagination */}
        {ads.length > 1 && (
          <div className="hidden sm:flex items-center gap-1 shrink-0">
            {ads.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIdx ? 'opacity-100 w-3' : 'opacity-40'}`}
                style={{ backgroundColor: fg }}
              />
            ))}
          </div>
        )}

        {/* Close */}
        <button
          onClick={handleDismiss}
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:opacity-70 transition-opacity"
          style={{ color: fg }}
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar for auto-rotation */}
      {ads.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 opacity-30" style={{ backgroundColor: fg }}>
          <div
            className="h-full animate-[progress_6s_linear_infinite]"
            style={{ backgroundColor: fg }}
          />
        </div>
      )}
    </div>
  );
}
