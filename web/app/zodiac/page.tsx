import { Metadata } from 'next';
import Link from 'next/link';
import { ListingLayout } from '../../components/templates';

export const metadata: Metadata = {
  title: 'Zodiac Signs | Famous People by Zodiac Sign | FamousPeople.id',
  description: 'Explore celebrities by zodiac sign. Discover famous people born under Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, and Pisces.',
  alternates: {
    canonical: 'https://famouspeople.id/zodiac',
  },
  openGraph: {
    title: 'Zodiac Signs | Famous People by Zodiac Sign | FamousPeople.id',
    description: 'Explore celebrities by zodiac sign. Discover famous people born under all 12 zodiac signs.',
    url: 'https://famouspeople.id/zodiac',
  },
};

const zodiacSigns = [
  { sign: 'aries', name: 'Aries', emoji: '♈', dates: 'Mar 21 - Apr 19' },
  { sign: 'taurus', name: 'Taurus', emoji: '♉', dates: 'Apr 20 - May 20' },
  { sign: 'gemini', name: 'Gemini', emoji: '♊', dates: 'May 21 - Jun 20' },
  { sign: 'cancer', name: 'Cancer', emoji: '♋', dates: 'Jun 21 - Jul 22' },
  { sign: 'leo', name: 'Leo', emoji: '♌', dates: 'Jul 23 - Aug 22' },
  { sign: 'virgo', name: 'Virgo', emoji: '♍', dates: 'Aug 23 - Sep 22' },
  { sign: 'libra', name: 'Libra', emoji: '♎', dates: 'Sep 23 - Oct 22' },
  { sign: 'scorpio', name: 'Scorpio', emoji: '♏', dates: 'Oct 23 - Nov 21' },
  { sign: 'sagittarius', name: 'Sagittarius', emoji: '♐', dates: 'Nov 22 - Dec 21' },
  { sign: 'capricorn', name: 'Capricorn', emoji: '♑', dates: 'Dec 22 - Jan 19' },
  { sign: 'aquarius', name: 'Aquarius', emoji: '♒', dates: 'Jan 20 - Feb 18' },
  { sign: 'pisces', name: 'Pisces', emoji: '♓', dates: 'Feb 19 - Mar 20' },
];

export default function ZodiacIndexPage() {
  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Browse by Zodiac Sign</h1>
        <p className="mt-2 text-sm text-text-secondary">
          Explore famous people by their zodiac sign. Discover celebrities born under each of the 12 astrological signs.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {zodiacSigns.map((zodiac) => (
          <Link
            key={zodiac.sign}
            href={`/zodiac/${zodiac.sign}`}
            className="group rounded-2xl border border-surface-border bg-white p-6 shadow-card transition-all hover:border-primary-500 hover:shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{zodiac.emoji}</span>
              <div>
                <h2 className="text-lg font-semibold text-text-primary group-hover:text-primary-600">
                  {zodiac.name}
                </h2>
                <p className="text-sm text-text-secondary">{zodiac.dates}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </ListingLayout>
  );
}
