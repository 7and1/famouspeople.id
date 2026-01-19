import { ListingLayout } from '../../../components/templates';
import { PersonCard } from '../../../components/organisms';
import { getBirthdaysMonth } from '../../../lib/api/birthdays';

const monthNames = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

export default async function BirthdayMonthPage({ params }: { params: { month: string } }) {
  const month = params.month.toLowerCase();
  if (!monthNames.includes(month)) {
    return (
      <ListingLayout>
        <div className="rounded-2xl border border-dashed border-surface-border p-8 text-center text-sm text-text-muted">
          Invalid month.
        </div>
      </ListingLayout>
    );
  }

  const data = await getBirthdaysMonth(month, 300).catch(() => []);

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Famous Birthdays in {month.charAt(0).toUpperCase() + month.slice(1)}</h1>
        <p className="mt-2 text-sm text-text-secondary">Celebrities born in {month}.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((person) => (
          <PersonCard key={person.fpid} {...person} showQuickFacts />
        ))}
      </div>
    </ListingLayout>
  );
}
