import { Metadata } from 'next';
import { ListingLayout } from '../../components/templates';
import { PersonCard } from '../../components/organisms/PersonCard';
import { getBirthdaysToday } from '../../lib/api/birthdays';

export const metadata: Metadata = {
  title: 'Famous Birthdays Today | Celebrity Birthdays | FamousPeople.id',
  description: 'Discover celebrities born today. Find famous actors, musicians, athletes, and influencers celebrating their birthday today on FamousPeople.id.',
  alternates: { canonical: '/birthday-today' },
  openGraph: {
    title: 'Famous Birthdays Today | Celebrity Birthdays | FamousPeople.id',
    description: 'Discover celebrities born today. Find famous actors, musicians, athletes, and influencers celebrating their birthday today.',
  },
};

export default async function BirthdayTodayPage() {
  const today = new Date();
  const formatted = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const data = await getBirthdaysToday(200).catch(() => []);

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Famous Birthdays Today</h1>
        <p className="mt-2 text-sm text-text-secondary">Celebrities born on {formatted}.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((person) => (
          <PersonCard key={person.fpid} {...person} showQuickFacts />
        ))}
      </div>
    </ListingLayout>
  );
}
