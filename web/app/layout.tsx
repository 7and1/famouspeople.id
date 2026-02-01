import './globals.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '../components/organisms/Navigation';
import { CookieConsent } from '../components/organisms/CookieConsent';
import { CookiePreferencesLink } from '../components/organisms/CookiePreferencesLink';
import { buildOrganizationSchema, buildWebsiteSchema } from '../lib/seo/schema';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.famouspeople.id/api/v1';
const apiOrigin = (() => {
  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return 'https://api.famouspeople.id';
  }
})();

export const metadata: Metadata = {
  title: 'FamousPeople.id | Celebrity Net Worth, Height & Facts',
  description: 'Discover 10,000+ celebrity profiles with net worth, height, zodiac signs, MBTI types, and relationships. Browse rankings, birthdays, and comparisons—fast.',
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: 'FamousPeople.id | Celebrity Net Worth, Height & Facts',
    description: 'Discover 10,000+ celebrity profiles with net worth, height, zodiac signs, MBTI types, and relationships. Browse rankings, birthdays, and comparisons—fast.',
    url: '/',
    siteName: 'FamousPeople.id',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'FamousPeople.id' }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FamousPeople.id | Celebrity Net Worth, Height & Facts',
    description: 'Discover 10,000+ celebrity profiles with net worth, height, zodiac signs, MBTI types, and relationships. Browse rankings, birthdays, and comparisons—fast.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const structuredData = JSON.stringify([
    buildOrganizationSchema(siteUrl),
    buildWebsiteSchema(siteUrl),
  ]);

  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <head>
        {/* Resource hints for faster connection establishment */}
        <link rel="preconnect" href={siteUrl} />
        <link rel="dns-prefetch" href={siteUrl} />
        <link rel="preconnect" href={apiOrigin} />
        <link rel="dns-prefetch" href={apiOrigin} />
        <link rel="preconnect" href="https://cdn.famouspeople.id" />
        <link rel="dns-prefetch" href="https://cdn.famouspeople.id" />
        <link rel="alternate" type="application/rss+xml" title="FamousPeople.id RSS" href="/rss.xml" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData }} />
      </head>
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-6 focus:top-6 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-700 focus:shadow-lg"
        >
          Skip to main content
        </a>
        <header className="sticky top-0 z-40 border-b border-surface-border bg-white/70 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-text-primary">
              <span className="h-9 w-9 rounded-full bg-brand-500/10 text-brand-700 grid place-items-center font-semibold">FP</span>
              FamousPeople.id
            </Link>
            <Navigation />
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-6xl px-6 py-10">
          {children}
        </main>
        <footer className="border-t border-surface-border bg-surface-muted">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-text-secondary md:flex-row md:items-center md:justify-between">
            <span>© 2026 FamousPeople.id. All rights reserved.</span>
            <div className="flex flex-wrap gap-4">
              <a href="mailto:hello@famouspeople.id" className="hover:text-brand-700">hello@famouspeople.id</a>
              <Link href="/about" className="hover:text-brand-700">About</Link>
              <Link href="/author/editorial-team" className="hover:text-brand-700">Editorial</Link>
              <CookiePreferencesLink />
              <Link href="/sitemap.xml" className="hover:text-brand-700">Sitemap</Link>
              <Link href="/richest" className="hover:text-brand-700">Rankings</Link>
              <Link href="/search" className="hover:text-brand-700">Search</Link>
              <Link href="/privacy" className="hover:text-brand-700">Privacy</Link>
              <Link href="/terms" className="hover:text-brand-700">Terms</Link>
            </div>
          </div>
        </footer>
        <CookieConsent />
      </body>
    </html>
  );
}
