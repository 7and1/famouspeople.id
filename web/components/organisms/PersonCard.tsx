import Link from 'next/link';
import { Avatar, Badge } from '../atoms';
import { formatCurrencyShort, formatDate, formatHeight } from '../../lib/utils/format';

interface PersonCardProps {
  fpid: string;
  slug: string;
  full_name: string;
  image_url?: string | null;
  net_worth?: number | null;
  occupation?: string[];
  birth_date?: string | null;
  country?: string[];
  zodiac?: string | null;
  mbti?: string | null;
  height_cm?: number | null;
  variant?: 'default' | 'compact' | 'featured';
  showQuickFacts?: boolean;
}

export function PersonCard({
  slug,
  full_name,
  image_url,
  net_worth,
  occupation = [],
  birth_date,
  country = [],
  zodiac,
  mbti,
  height_cm,
  variant = 'default',
  showQuickFacts = false,
}: PersonCardProps) {
  return (
    <article className="group relative rounded-xl border border-surface-border bg-white p-4 shadow-card transition hover:shadow-md">
      <Link href={`/people/${slug}`} className="absolute inset-0 z-10" aria-label={full_name} />
      <div className="flex items-start gap-4">
        <Avatar src={image_url} alt={full_name} size={variant === 'featured' ? 'lg' : 'md'} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">{full_name}</h3>
            {zodiac ? <Badge variant="outline">{zodiac}</Badge> : null}
            {mbti ? <Badge variant="secondary">{mbti}</Badge> : null}
          </div>
          <p className="mt-1 text-xs text-text-secondary">
            {occupation.slice(0, 2).join(', ') || '—'}
            {country.length ? ` · ${country[0]}` : ''}
          </p>
          {showQuickFacts && (
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-text-secondary">
              <span>Net worth: {formatCurrencyShort(net_worth)}</span>
              <span>Born: {formatDate(birth_date)}</span>
              <span>Height: {formatHeight(height_cm)}</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
