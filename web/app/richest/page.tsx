import { ListingLayout } from '../../components/templates';
import { RankingList } from '../../components/organisms/RankingList';
import { getRankings } from '../../lib/api/rankings';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '100 Richest People in the World | FamousPeople.id',
  description: 'See the top richest celebrities and famous people ranked by net worth.',
  alternates: { canonical: '/richest' },
};

export default async function RichestPage() {
  const result = await getRankings('net-worth', undefined, 100).catch(() => ({ data: [] }));

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Richest People</h1>
        <p className="mt-2 text-sm text-text-secondary">Top celebrities ranked by net worth.</p>
      </header>
      <RankingList title="Top Net Worth" items={result.data || []} />
    </ListingLayout>
  );
}
