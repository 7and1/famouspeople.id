import { formatCurrencyShort, formatDate, formatHeight } from '../../lib/utils/format';

interface ComparisonPerson {
  slug: string;
  full_name: string;
  net_worth?: number | null;
  height_cm?: number | null;
  birth_date?: string | null;
  age?: number | null;
  zodiac?: string | null;
  mbti?: string | null;
  country?: string[];
  occupation?: string[];
}

export function ComparisonTable({ people }: { people: ComparisonPerson[] }) {
  const rows = [
    { label: 'Net Worth', render: (p: ComparisonPerson) => formatCurrencyShort(p.net_worth) },
    { label: 'Height', render: (p: ComparisonPerson) => formatHeight(p.height_cm) },
    { label: 'Birth Date', render: (p: ComparisonPerson) => formatDate(p.birth_date) },
    { label: 'Age', render: (p: ComparisonPerson) => (p.age ? `${p.age} years` : '—') },
    { label: 'Zodiac', render: (p: ComparisonPerson) => p.zodiac || '—' },
    { label: 'MBTI', render: (p: ComparisonPerson) => p.mbti || '—' },
    { label: 'Country', render: (p: ComparisonPerson) => p.country?.join(', ') || '—' },
    { label: 'Occupation', render: (p: ComparisonPerson) => p.occupation?.slice(0, 2).join(', ') || '—' },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-surface-border bg-white shadow-card">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-subtle text-text-secondary">
          <tr>
            <th className="px-4 py-3">Attribute</th>
            {people.map((person) => (
              <th key={person.slug} className="px-4 py-3">{person.full_name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-surface-border">
              <td className="px-4 py-3 font-medium text-text-secondary">{row.label}</td>
              {people.map((person) => (
                <td key={`${row.label}-${person.slug}`} className="px-4 py-3 text-text-primary">
                  {row.render(person)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
