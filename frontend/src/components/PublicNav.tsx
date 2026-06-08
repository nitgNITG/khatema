'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useT } from '@/store/langStore';
import LangToggle from './LangToggle';
import ThemeToggle from './ThemeToggle';
import { useAuthStore } from '@/store/authStore';

export default function PublicNav() {
  const { t, isAr } = useT();
  const { user } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/articles', label: t('articles') },
    { href: '/about', label: t('about') },
    { href: '/suggestions', label: t('suggestions') },
    { href: '/contact', label: t('contact') },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-10 h-9">
            <Image
              src="/nitg-logo.avif"
              alt="NITG"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <span className="text-xl font-extrabold text-primary">ختمة</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-semibold text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          <LangToggle />
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" className="btn-duo btn-duo-primary text-sm px-4 py-2">
              {t('dashboard')}
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:block text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2">
                {t('login')}
              </Link>
              <Link href="/register" className="btn-duo btn-duo-primary text-sm px-4 py-2">
                {t('register')}
              </Link>
            </>
          )}

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-border/40 transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-primary/5 hover:text-primary transition-colors"
            >
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link href="/login" onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 text-sm font-semibold rounded-lg hover:bg-primary/5 hover:text-primary transition-colors">
              {t('login')}
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
