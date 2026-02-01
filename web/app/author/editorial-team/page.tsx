import type { Metadata } from 'next';
import Link from 'next/link';
import { ListingLayout } from '../../../components/templates';
import { buildEditorialAuthorSchema, buildWebPageSchema } from '../../../lib/seo/schema';

export const metadata: Metadata = {
  title: 'Editorial Team | FamousPeople.id',
  description: 'Meet the FamousPeople.id editorial team. Learn how we source data, handle citations, publish updates, and process corrections.',
  alternates: { canonical: '/author/editorial-team' },
};

export default function EditorialTeamPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  const title = 'FamousPeople.id Editorial Team';
  const description = 'Our editorial standards, sourcing methodology, and how to request corrections.';

  const webPageSchema = buildWebPageSchema(title, description, siteUrl, '/author/editorial-team');
  const authorSchema = buildEditorialAuthorSchema(siteUrl);

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">FamousPeople.id Editorial Team</h1>
        <p className="mt-2 text-sm text-text-secondary">
          We publish structured profiles about public figures—net worth, height, birthdays, personality traits, and relationship networks—backed by citations and transparent sourcing.
        </p>
      </header>

      <section className="prose max-w-none rounded-2xl border border-surface-border bg-white p-6 text-sm text-text-secondary shadow-card">
        <h2>What we do</h2>
        <p>
          FamousPeople.id is designed for discovery at scale. Our editorial responsibility is to keep pages useful, consistent, and trustworthy
          even when the underlying information is incomplete, disputed, or changes over time. You will see clear timestamps where available,
          and we surface sources whenever we can so readers can verify important facts quickly.
        </p>

        <h2>Editorial principles</h2>
        <ul>
          <li><strong>Accuracy first</strong>: we prefer verified, primary, or widely trusted references over rumors and speculation.</li>
          <li><strong>Transparency</strong>: key facts may include source labels and links; when sources disagree, we avoid overconfident claims.</li>
          <li><strong>Neutral tone</strong>: we focus on factual summaries and avoid sensational or defamatory wording.</li>
          <li><strong>Freshness</strong>: profiles can change as careers evolve; we track updates and improve pages continuously.</li>
          <li><strong>Privacy</strong>: we avoid publishing unnecessary sensitive personal data and respect removal/correction requests.</li>
        </ul>

        <h2>Where our data comes from</h2>
        <p>
          Our base dataset is derived from public structured sources (such as Wikidata/Wikipedia) and other reputable references.
          We normalize fields like names, occupations, countries, and dates so pages are consistent and indexable. Some attributes (like net worth)
          are estimates compiled from multiple public references and may change over time.
        </p>
        <ul>
          <li>Structured sources: Wikidata/Wikipedia</li>
          <li>Reputable references: public records, official biographies, and trusted publications</li>
          <li>Profile-level citations: exposed on pages when available as <em>Sources</em></li>
        </ul>

        <h2>Corrections</h2>
        <p>
          If you believe a profile is inaccurate, email <a href="mailto:hello@famouspeople.id">hello@famouspeople.id</a> with the profile URL,
          the fields to correct, and supporting sources. We review submissions and update profiles when evidence supports a change.
        </p>

        <h2>More about FamousPeople.id</h2>
        <p>
          See <Link href="/about">About</Link> for a deeper overview of methodology, and review <Link href="/privacy">Privacy Policy</Link> and{' '}
          <Link href="/terms">Terms of Service</Link> for legal details.
        </p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }} />
    </ListingLayout>
  );
}

