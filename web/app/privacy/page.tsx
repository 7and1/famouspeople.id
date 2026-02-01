import type { Metadata } from 'next';
import Link from 'next/link';
import { ListingLayout } from '../../components/templates';

export const metadata: Metadata = {
  title: 'Privacy Policy | FamousPeople.id',
  description: 'Learn how FamousPeople.id collects, uses, and protects information, including cookies and third-party content sources.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Privacy Policy</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Last updated: January 31, 2026
        </p>
      </header>

      <section className="prose max-w-none rounded-2xl border border-surface-border bg-white p-6 text-sm text-text-secondary shadow-card">
        <h2>Overview</h2>
        <p>
          FamousPeople.id is an informational website that publishes public-figure profiles and rankings.
          This policy explains what information we collect and how we use it.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li><strong>Basic analytics</strong>: aggregated usage data (e.g. pages viewed, referrers) to improve performance and content.</li>
          <li><strong>Cookies</strong>: essential cookies for site functionality and optional cookies for measurement.</li>
        </ul>

        <h2>Cookies</h2>
        <p>
          We use cookies to enhance your experience. Essential cookies are always active. Optional cookies help us measure and improve the website.
          You can update your choice any time using the Cookie Preferences link in the site footer.
        </p>

        <h2>Data sources</h2>
        <p>
          Profile data is derived from public sources such as Wikidata/Wikipedia and other reputable references.
          If you believe content is inaccurate, please contact us at <a href="mailto:hello@famouspeople.id">hello@famouspeople.id</a>.
        </p>

        <h2>Third-party links</h2>
        <p>
          Pages may link to third-party websites. We are not responsible for the privacy practices of those sites.
        </p>

        <h2>Contact</h2>
        <p>
          Questions about this policy: <a href="mailto:hello@famouspeople.id">hello@famouspeople.id</a>.
          You may also review our <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>
    </ListingLayout>
  );
}
