import { HomeLayout } from '../components/templates';
import { CategoryGrid, HomeSearch, RankingList } from '../components/organisms';
import { StatCard } from '../components/molecules';
import { getRankings } from '../lib/api/rankings';

export default async function HomePage() {
  const [netWorth, height] = await Promise.all([
    getRankings('net-worth', undefined, 5).catch(() => ({ data: [] })),
    getRankings('height', undefined, 5).catch(() => ({ data: [] })),
  ]);

  const categories = [
    { title: 'Zodiac Signs', description: 'Explore celebrities by zodiac sign.', href: '/zodiac/aries' },
    { title: 'MBTI Types', description: 'Find famous people by personality type.', href: '/mbti/intj' },
    { title: 'Countries', description: 'Browse by country of origin.', href: '/country/us' },
    { title: 'Occupations', description: 'Discover actors, athletes, and more.', href: '/occupation/actor' },
    { title: 'Relationships', description: 'See who dated whom in pop culture.', href: '/relationships/elon-musk' },
    { title: 'Birthdays', description: 'Find celebrities born today.', href: '/birthday-today' },
  ];

  return (
    <HomeLayout>
      <section className="rounded-3xl border border-surface-border bg-white/80 p-8 shadow-card">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-semibold text-text-primary">FamousPeople.id</h1>
          <p className="mt-4 text-base text-text-secondary">
            Discover 10K+ celebrity profiles with net worth, height, personality types, and relationship history—built for fast, global access.
          </p>
        </div>
        <div className="mt-8">
          <HomeSearch />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Profiles" value="10,000+" description="Curated from Wikidata & trusted sources." accent="Live" />
          <StatCard label="Updates" value="Daily" description="Automated pipelines keep data fresh." accent="Pipeline" />
          <StatCard label="Edge Cache" value="<100ms" description="Global Cloudflare edge delivery." accent="Fast" />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text-primary">Explore Categories</h2>
        <p className="mt-2 text-sm text-text-secondary">Jump into curated lists and rankings.</p>
        <div className="mt-4">
          <CategoryGrid items={categories} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RankingList title="Top Net Worth" items={netWorth.data || []} />
        <RankingList title="Tallest Celebrities" items={height.data || []} />
      </section>
    </HomeLayout>
  );
}
