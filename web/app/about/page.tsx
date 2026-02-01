import type { Metadata } from 'next';
import Link from 'next/link';
import { ListingLayout } from '../../components/templates';
import { buildWebPageSchema } from '../../lib/seo/schema';

export const metadata: Metadata = {
  title: 'About | FamousPeople.id',
  description: 'Learn how FamousPeople.id builds celebrity profiles, sources data, and maintains editorial standards for accuracy and transparency.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  const title = 'About FamousPeople.id';
  const description = 'How we build profiles, cite sources, and handle corrections.';
  const schema = buildWebPageSchema(title, description, siteUrl, '/about');

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">About FamousPeople.id</h1>
        <p className="mt-2 text-sm text-text-secondary">
          We publish structured, SEO-friendly profiles about public figures—net worth, height, birthdays, personality traits, and relationships—backed by citations and transparent sourcing.
        </p>
      </header>

      <section className="prose max-w-none rounded-2xl border border-surface-border bg-white p-6 text-sm text-text-secondary shadow-card">
        <h2 id="methodology">Methodology</h2>
        <p>
          FamousPeople.id compiles data from public sources (such as Wikidata/Wikipedia) and reputable references.
          We normalize the information into a consistent schema so pages are easy to browse, compare, and index.
        </p>
        <ul>
          <li><strong>Profiles</strong> are stored as structured fields (net worth, height, birthday, country, occupation).</li>
          <li><strong>Relationships</strong> are represented as a graph (edges + types) to enable discovery and comparisons.</li>
          <li><strong>Updates</strong> are tracked by timestamps so search engines and users can see freshness.</li>
        </ul>

        <h2 id="sources">Sources and citations</h2>
        <p>
          Wherever possible, key facts show a source label and (when available) an external link.
          If a source link is not available, we still disclose the source name so the claim is traceable.
        </p>

        <h2 id="editorial">Editorial standards</h2>
        <p>
          Our goal is accuracy, clarity, and neutrality. Profiles may include estimated values (such as net worth),
          which can vary across sources and change over time. We avoid sensational claims and prioritize verifiable references.
        </p>
        <p>
          For more details about our publishing standards, see the <Link href="/author/editorial-team">Editorial Team</Link> page.
        </p>

        <h2 id="corrections">Corrections</h2>
        <p>
          If you believe a profile is inaccurate, email{' '}
          <a href="mailto:hello@famouspeople.id">hello@famouspeople.id</a>{' '}
          with the profile URL, the field(s) to correct, and supporting sources.
        </p>

        <h2 id="contact">Contact</h2>
        <p>
          Email: <a href="mailto:hello@famouspeople.id">hello@famouspeople.id</a>. Legal: see{' '}
          <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>.
        </p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
    </ListingLayout>
  );
}
