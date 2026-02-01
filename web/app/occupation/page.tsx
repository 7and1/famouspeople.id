import { Metadata } from 'next';
import Link from 'next/link';
import { ListingLayout } from '../../components/templates';

export const metadata: Metadata = {
  title: 'Browse by Occupation | Famous People by Profession | FamousPeople.id',
  description: 'Explore celebrities by occupation. Discover famous actors, musicians, athletes, entrepreneurs, politicians, scientists, and more.',
  alternates: {
    canonical: 'https://famouspeople.id/occupation',
  },
  openGraph: {
    title: 'Browse by Occupation | Famous People by Profession | FamousPeople.id',
    description: 'Explore celebrities by occupation. Discover famous people across all professions and industries.',
    url: 'https://famouspeople.id/occupation',
  },
};

const occupations = [
  { slug: 'actor', name: 'Actors', description: 'Film and television actors' },
  { slug: 'musician', name: 'Musicians', description: 'Singers, bands, and instrumentalists' },
  { slug: 'athlete', name: 'Athletes', description: 'Sports stars and competitors' },
  { slug: 'entrepreneur', name: 'Entrepreneurs', description: 'Business founders and innovators' },
  { slug: 'politician', name: 'Politicians', description: 'Government leaders and officials' },
  { slug: 'director', name: 'Directors', description: 'Film and television directors' },
  { slug: 'writer', name: 'Writers', description: 'Authors, journalists, and screenwriters' },
  { slug: 'scientist', name: 'Scientists', description: 'Researchers and innovators' },
  { slug: 'model', name: 'Models', description: 'Fashion and commercial models' },
  { slug: 'comedian', name: 'Comedians', description: 'Stand-up and comedy performers' },
  { slug: 'producer', name: 'Producers', description: 'Film, TV, and music producers' },
  { slug: 'artist', name: 'Artists', description: 'Visual artists and painters' },
];

export default function OccupationIndexPage() {
  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Browse by Occupation</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Explore famous people by their profession. Discover celebrities across various industries and fields.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {occupations.map((occupation) => (
          <Link
            key={occupation.slug}
            href={`/occupation/${occupation.slug}`}
            className="group rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-all hover:border-primary-500 hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold text-text-primary group-hover:text-primary-600">
              {occupation.name}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{occupation.description}</p>
          </Link>
        ))}
      </div>
    </ListingLayout>
  );
}
