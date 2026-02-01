import { Metadata } from 'next';
import Link from 'next/link';
import { ListingLayout } from '../../components/templates';

export const metadata: Metadata = {
  title: 'MBTI Personality Types | Famous People by MBTI | FamousPeople.id',
  description: 'Explore celebrities by MBTI personality type. Discover famous people with INTJ, ENFP, INFP, ENTJ, ISTJ, ISFJ, ESTP, ESFP and all 16 Myers-Briggs types.',
  alternates: {
    canonical: 'https://famouspeople.id/mbti',
  },
  openGraph: {
    title: 'MBTI Personality Types | Famous People by MBTI | FamousPeople.id',
    description: 'Explore celebrities by MBTI personality type. Discover famous people across all 16 Myers-Briggs types.',
    url: 'https://famouspeople.id/mbti',
  },
};

const mbtiTypes = [
  { type: 'INTJ', name: 'The Architect', category: 'Analysts' },
  { type: 'INTP', name: 'The Logician', category: 'Analysts' },
  { type: 'ENTJ', name: 'The Commander', category: 'Analysts' },
  { type: 'ENTP', name: 'The Debater', category: 'Analysts' },
  { type: 'INFJ', name: 'The Advocate', category: 'Diplomats' },
  { type: 'INFP', name: 'The Mediator', category: 'Diplomats' },
  { type: 'ENFJ', name: 'The Protagonist', category: 'Diplomats' },
  { type: 'ENFP', name: 'The Campaigner', category: 'Diplomats' },
  { type: 'ISTJ', name: 'The Logistician', category: 'Sentinels' },
  { type: 'ISFJ', name: 'The Defender', category: 'Sentinels' },
  { type: 'ESTJ', name: 'The Executive', category: 'Sentinels' },
  { type: 'ESFJ', name: 'The Consul', category: 'Sentinels' },
  { type: 'ISTP', name: 'The Virtuoso', category: 'Explorers' },
  { type: 'ISFP', name: 'The Adventurer', category: 'Explorers' },
  { type: 'ESTP', name: 'The Entrepreneur', category: 'Explorers' },
  { type: 'ESFP', name: 'The Entertainer', category: 'Explorers' },
];

const categories = ['Analysts', 'Diplomats', 'Sentinels', 'Explorers'];

export default function MBTIIndexPage() {
  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Browse by MBTI Personality Type</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Explore famous people by their Myers-Briggs Type Indicator (MBTI) personality type. Discover celebrities across all 16 personality types.
        </p>
      </header>

      {categories.map((category) => (
        <div key={category}>
          <h2 className="mb-4 text-xl font-semibold text-text-primary">{category}</h2>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mbtiTypes
              .filter((mbti) => mbti.category === category)
              .map((mbti) => (
                <Link
                  key={mbti.type}
                  href={`/mbti/${mbti.type}`}
                  className="group rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-all hover:border-primary-500 hover:shadow-lg"
                >
                  <h3 className="text-lg font-bold text-primary-600 group-hover:text-primary-700">
                    {mbti.type}
                  </h3>
                  <p className="mt-1 text-sm text-text-secondary">{mbti.name}</p>
                </Link>
              ))}
          </div>
        </div>
      ))}
    </ListingLayout>
  );
}
