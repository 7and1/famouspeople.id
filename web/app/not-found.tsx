import { Metadata } from 'next';
import Link from 'next/link';
import { SearchBox } from '../components/molecules/SearchBox';

export const metadata: Metadata = {
  title: 'Page Not Found | FamousPeople.id',
  description: 'The page you are looking for doesn\'t exist. Search for celebrities or explore our categories.',
  robots: {
    index: false,
    follow: true,
  },
};

const quickLinks = [
  { href: '/search', label: 'Search People', description: 'Find any celebrity' },
  { href: '/richest', label: 'Richest Celebrities', description: 'Top net worth rankings' },
  { href: '/tallest', label: 'Tallest Celebrities', description: 'Height rankings' },
  { href: '/zodiac/aries', label: 'Zodiac Signs', description: 'Explore by star sign' },
  { href: '/mbti/intj', label: 'MBTI Types', description: 'Personity type rankings' },
  { href: '/birthday-today', label: 'Birthdays', description: 'Born today' },
];

export default function NotFound() {
  return (
    <div className="mx-auto max-w-3xl">
      <section className="rounded-3xl border border-dashed border-surface-border bg-white/80 p-10 text-center shadow-card">
        {/* 404 Icon */}
        <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-brand-50">
          <span className="text-4xl">🔍</span>
        </div>

        {/* Main Message */}
        <h1 className="text-3xl font-semibold text-text-primary">Page not found</h1>
        <p className="mt-3 text-base text-text-secondary">
          The page you are looking for doesn't exist or has been moved.
        </p>

        {/* Search Box */}
        <div className="mx-auto mt-8 max-w-xl">
          <SearchBox
            variant="hero"
            placeholder="Search for a celebrity..."
            onSubmit={(value) => {
              if (value) window.location.href = `/search?q=${encodeURIComponent(value)}`;
            }}
          />
        </div>

        {/* Quick Links */}
        <div className="mt-10">
          <h2 className="text-sm font-medium text-text-secondary">
            Or explore popular categories
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex flex-col rounded-xl border border-surface-border bg-surface-subtle p-4 text-left transition hover:border-brand-300 hover:bg-brand-50 hover:shadow-sm"
              >
                <span className="text-sm font-medium text-text-primary group-hover:text-brand-700">
                  {link.label}
                </span>
                <span className="mt-1 text-xs text-text-secondary">
                  {link.description}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 pt-6 border-t border-surface-border">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-900 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to homepage
          </Link>
        </div>
      </section>

      {/* Random Profile CTA */}
      <section className="mt-6 text-center">
        <p className="text-sm text-text-secondary">
          Feeling lucky? <Link href="/richest" className="text-brand-700 hover:underline font-medium">
            Browse top rankings
          </Link> or <Link href="/search" className="text-brand-700 hover:underline font-medium">
            search for someone specific
          </Link>.
        </p>
      </section>
    </div>
  );
}
