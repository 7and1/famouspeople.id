import Link from 'next/link';
import { Badge } from '../atoms';
import { formatCurrencyShort } from '../../lib/utils/format';

interface RankingItem {
  rank: number;
  slug: string;
  full_name: string;
  value: number | null;
  formatted_value?: string | null;
}

export function RankingList({ items, title }: { items: RankingItem[]; title: string }) {
  return (
    <section className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        <Badge variant="outline">Top {items.length}</Badge>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <Link key={item.slug} href={`/people/${item.slug}`} className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3 text-sm hover:border-brand-500">
            <span className="font-semibold text-text-primary">#{item.rank}</span>
            <span className="flex-1 px-3 text-text-secondary">{item.full_name}</span>
            <span className="text-text-primary">{item.formatted_value || formatCurrencyShort(item.value)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
