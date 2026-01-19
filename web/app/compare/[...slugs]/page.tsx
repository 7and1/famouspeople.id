import { redirect } from 'next/navigation';
import { ComparisonLayout } from '../../../components/templates';
import { ComparisonTable } from '../../../components/organisms';
import { comparePeople } from '../../../lib/api/compare';

const normalizeCompareUrl = (slugs: string[]) => {
  const sorted = [...slugs].sort();
  return `/compare/${sorted.join('-vs-')}`;
};

export default async function ComparePage({ params }: { params: { slugs: string[] } }) {
  const raw = params.slugs.join('/');
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
