import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '../components/organisms/Navigation';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'FamousPeople.id | Celebrity Net Worth, Height & Facts',
  description: 'FamousPeople.id is a fast, data-rich celebrity database with net worth, height, zodiac, MBTI, and relationships.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id'),
};

export const runtime = 'edge';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <header className="sticky top-0 z-40 border-b border-surface-border bg-white/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <span className="h-9 w-9 rounded-full bg-brand-500/10 text-brand-700 grid place-items-center font-semibold">FP</span>
              FamousPeople.id
            </Link>
            <Navigation />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-surface-border bg-surface-muted">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
            <span>© 2026 FamousPeople.id. All rights reserved.</span>
            <div className="flex gap-4">
              <Link href="/sitemap.xml" className="hover:text-brand-700">Sitemap</Link>
              <Link href="/richest" className="hover:text-brand-700">Rankings</Link>
              <Link href="/search" className="hover:text-brand-700">Search</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
