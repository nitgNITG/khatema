'use client';

import { useLangStore } from '@/store/langStore';

export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, toggle } = useLangStore();

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-border/40 transition-colors ${className}`}
      title={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      {lang === 'ar' ? (
        <>
          <span className="text-xs">🌐</span>
          <span>En</span>
        </>
      ) : (
        <>
          <span className="text-xs">🌐</span>
          <span>ع</span>
        </>
      )}
    </button>
  );
}
