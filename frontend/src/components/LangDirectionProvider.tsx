'use client';

import { useEffect } from 'react';
import { useLangStore } from '@/store/langStore';

/**
 * Syncs <html dir> and <html lang> with the Zustand lang store.
 * Rendered once at the root — no visible output.
 */
export function LangDirectionProvider() {
  const lang = useLangStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.dir  = lang === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = lang === 'en' ? 'en' : 'ar';
  }, [lang]);

  return null;
}
