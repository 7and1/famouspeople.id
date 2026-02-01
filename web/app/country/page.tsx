import { Metadata } from 'next';
import Link from 'next/link';
import { ListingLayout } from '../../components/templates';

export const metadata: Metadata = {
  title: 'Browse by Country | Famous People by Nationality | FamousPeople.id',
  description: 'Explore celebrities by country. Discover famous people from the United States, United Kingdom, Canada, Australia, India, and countries worldwide.',
  alternates: {
    canonical: 'https://famouspeople.id/country',
  },
  openGraph: {
    title: 'Browse by Country | Famous People by Nationality | FamousPeople.id',
    description: 'Explore celebrities by country. Discover famous people from nations around the world.',
    url: 'https://famouspeople.id/country',
  },
};

const countries = [
  { code: 'united-states', name: 'United States', flag: '🇺🇸' },
  { code: 'united-kingdom', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'canada', name: 'Canada', flag: '🇨🇦' },
  { code: 'australia', name: 'Australia', flag: '🇦🇺' },
  { code: 'india', name: 'India', flag: '🇮🇳' },
  { code: 'france', name: 'France', flag: '🇫🇷' },
  { code: 'germany', name: 'Germany', flag: '🇩🇪' },
  { code: 'italy', name: 'Italy', flag: '🇮🇹' },
  { code: 'spain', name: 'Spain', flag: '🇪🇸' },
  { code: 'japan', name: 'Japan', flag: '🇯🇵' },
  { code: 'south-korea', name: 'South Korea', flag: '🇰🇷' },
  { code: 'brazil', name: 'Brazil', flag: '🇧🇷' },
  { code: 'mexico', name: 'Mexico', flag: '🇲🇽' },
  { code: 'argentina', name: 'Argentina', flag: '🇦🇷' },
  { code: 'china', name: 'China', flag: '🇨🇳' },
  { code: 'russia', name: 'Russia', flag: '🇷🇺' },
];

export default function CountryIndexPage() {
  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Browse by Country</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Explore famous people by their country of origin. Discover celebrities from nations around the world.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {countries.map((country) => (
          <Link
            key={country.code}
            href={`/country/${country.code}`}
            className="group rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-all hover:border-primary-500 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{country.flag}</span>
              <h2 className="text-lg font-semibold text-text-primary group-hover:text-primary-600">
                {country.name}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </ListingLayout>
  );
}
