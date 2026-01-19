import { ListingLayout } from '../../components/templates';
import { RankingList } from '../../components/organisms';
import { getRankings } from '../../lib/api/rankings';

export const metadata = {
  title: 'Tallest Celebrities | FamousPeople.id',
  description: 'The tallest celebrities and famous people ranked by height.',
};

export default async function TallestPage() {
  const result = await getRankings('height', undefined, 100).catch(() => ({ data: [] }));

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Tallest Celebrities</h1>
        <p className="mt-2 text-sm text-text-secondary">Tallest famous people ranked by height.</p>
      </header>
      <RankingList title="Tallest People" items={result.data || []} />
    </ListingLayout>
  );
}
