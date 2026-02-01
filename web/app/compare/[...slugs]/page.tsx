import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { ComparisonLayout } from '../../../components/templates';
import { ComparisonTable } from '../../../components/organisms/ComparisonTable';
import { comparePeople } from '../../../lib/api/compare';

const normalizeCompareUrl = (slugs: string[]) => {
  const sorted = [...slugs].sort();
  return `/compare/${sorted.join('-vs-')}`;
};

// Generate static params for comparisons
export async function generateStaticParams() {
  return [{ slugs: ['elon-musk', 'jeff-bezos'] }];
}

export async function generateMetadata({ params }: { params: Promise<{ slugs: string[] }> }): Promise<Metadata> {
  const { slugs: slugsParam } = await params;
  const raw = slugsParam.join('/');
  const slugs = raw.split('-vs-').map((slug) => slug.trim()).filter(Boolean);
  if (slugs.length < 2) {
    return {
      title: 'Compare Celebrities | FamousPeople.id',
      description: 'Compare celebrities side by side on FamousPeople.id.',
      robots: 'noindex, follow',
      alternates: { canonical: '/compare' },
    };
  }

  const canonical = normalizeCompareUrl(slugs);
  const title = `Compare: ${slugs.join(' vs ')} | FamousPeople.id`;
  const description = `Compare ${slugs.join(' vs ')} side by side: net worth, height, age, and key facts.`;

  return {
    title,
    description,
    robots: 'noindex, follow',
    alternates: { canonical },
    openGraph: { title, description, type: 'website' },
    twitter: { card: 'summary', title, description },
  };
}

export default async function ComparePage({ params }: { params: Promise<{ slugs: string[] }> }) {
  const { slugs: slugsParam } = await params;
  const raw = slugsParam.join('/');
  const slugs = raw.split('-vs-').map((slug) => slug.trim()).filter(Boolean);
  if (slugs.length < 2) {
    return redirect('/compare');
  }

  const canonical = normalizeCompareUrl(slugs);
  if (`/compare/${raw}` !== canonical) {
    return redirect(canonical);
  }

  const data = await comparePeople(slugs).catch(() => null);
  if (!data) {
    return redirect('/compare');
  }

  return (
    <ComparisonLayout>
      <h1 className="text-2xl font-semibold text-text-primary">{slugs.join(' vs ')}</h1>
      <p className="text-sm text-text-secondary">Side-by-side comparison of key facts.</p>
      <ComparisonTable people={data.people} />
    </ComparisonLayout>
  );
}
