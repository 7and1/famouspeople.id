import { Metadata } from 'next';
import { ListingLayout } from '../../components/templates';
import { PersonCard } from '../../components/organisms/PersonCard';
import { getRankings } from '../../lib/api/rankings';

export const metadata: Metadata = {
  title: 'Featured People | Trending Celebrities | FamousPeople.id',
  description: 'Discover trending celebrities and featured profiles on FamousPeople.id. Explore famous actors, musicians, athletes, and influencers with net worth, height, and biographical facts.',
  alternates: { canonical: '/people' },
  openGraph: {
    title: 'Featured People | Trending Celebrities | FamousPeople.id',
    description: 'Discover trending celebrities and featured profiles. Explore famous actors, musicians, athletes, and influencers with net worth, height, and biographical facts.',
  },
};

export default async function PeopleIndex() {
  const result = await getRankings('net-worth', undefined, 30).catch(() => ({ data: [] }));

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Featured People</h1>
        <p className="mt-2 text-sm text-text-secondary">Trending profiles from FamousPeople.id.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((person) => (
          <PersonCard key={person.fpid} {...person} showQuickFacts />
        ))}
      </div>
    </ListingLayout>
  );
}
