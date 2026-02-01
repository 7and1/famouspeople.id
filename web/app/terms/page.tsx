import type { Metadata } from 'next';
import Link from 'next/link';
import { ListingLayout } from '../../components/templates';

export const metadata: Metadata = {
  title: 'Terms of Service | FamousPeople.id',
  description: 'Terms governing your use of FamousPeople.id, including disclaimers for public data, accuracy, and limitations of liability.',
  alternates: { canonical: '/terms' },
};

export default function TermsOfServicePage() {
  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Terms of Service</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Last updated: January 31, 2026
        </p>
      </header>

      <section className="prose max-w-none rounded-2xl border border-surface-border bg-white p-6 text-sm text-text-secondary shadow-card">
        <h2>Acceptance of terms</h2>
        <p>
          By accessing or using FamousPeople.id, you agree to these Terms.
          If you do not agree, do not use the website.
        </p>

        <h2>Informational content</h2>
        <p>
          FamousPeople.id publishes informational content about public figures and related statistics.
          The website is provided for general information only and is not professional, legal, or financial advice.
        </p>

        <h2>Accuracy</h2>
        <p>
          We aim to provide accurate, up-to-date information but cannot guarantee completeness or accuracy at all times.
          Estimates (including net worth) may vary by source and change over time.
        </p>

        <h2>Third-party content and links</h2>
        <p>
          The website may display or link to third-party content. We do not control third-party websites and are not responsible for them.
        </p>

        <h2>Limitations of liability</h2>
        <p>
          To the fullest extent permitted by law, FamousPeople.id is provided “as is” without warranties of any kind.
          We are not liable for any damages arising from use of the site.
        </p>

        <h2>Contact</h2>
        <p>
          For questions or corrections, contact <a href="mailto:hello@famouspeople.id">hello@famouspeople.id</a>.
          See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>
    </ListingLayout>
  );
}

