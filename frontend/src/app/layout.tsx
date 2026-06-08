import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';

const arabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arabic',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'ختمة — اختم القرآن مع من تحب',
  description: 'منصة ختم القرآن الكريم بشكل جماعي أو فردي',
  keywords: ['ختمة', 'قرآن', 'ختم القرآن', 'ختمة جماعية'],
  openGraph: {
    title: 'ختمة',
    description: 'اختم القرآن مع من تحب',
    locale: 'ar_SA',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={arabic.variable}>
      <body className="min-h-screen bg-background font-arabic antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
