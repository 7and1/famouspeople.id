import Link from 'next/link';
import { getCategoryPeople } from '../../lib/api/categories';
import { Avatar } from '../atoms/Avatar';

interface SimilarPerson {
  fpid: string;
  slug: string;
  full_name: string;
  image_url?: string | null;
  occupation?: string[];
  zodiac?: string | null;
  mbti?: string | null;
  net_worth?: number | null;
}

interface SimilarByAttributeProps {
  type: 'zodiac' | 'mbti' | 'occupation';
  value: string;
  currentSlug: string;
  title?: string;
  linkHref?: string;
  linkText?: string;
}

async function getSimilarPeople(
  type: string,
  value: string,
  currentSlug: string,
  limit = 6
): Promise<SimilarPerson[]> {
  try {
    const result = await getCategoryPeople(type, value, limit + 6, 0, 'net_worth:desc');
    // Filter out the current person and limit results
    return result.data
      .filter((p: SimilarPerson) => p.slug !== currentSlug)
      .slice(0, limit);
  } catch {
    return [];
  }
}

function getSectionTitle(type: string, value: string): string {
  switch (type) {
    case 'zodiac':
      return `Other ${value} Celebrities`;
    case 'mbti':
      return `Other ${value.toUpperCase()} People`;
    case 'occupation':
      return `Other ${value} Celebrities`;
    default:
      return `Similar ${value}`;
  }
}

function getLinkHref(type: string, value: string): string {
  switch (type) {
    case 'zodiac':
      return `/zodiac/${value.toLowerCase()}`;
    case 'mbti':
      return `/mbti/${value.toLowerCase()}`;
    case 'occupation':
      return `/occupation/${value.toLowerCase().replace(/\s+/g, '-')}`;
    default:
      return '#';
  }
}

function getLinkText(type: string): string {
  switch (type) {
    case 'zodiac':
      return 'View all';
    case 'mbti':
      return 'View all';
    case 'occupation':
      return 'View all';
    default:
      return 'View all';
  }
}

export async function SimilarByAttribute({
  type,
  value,
  currentSlug,
  title,
  linkHref,
  linkText,
}: SimilarByAttributeProps) {
  const people = await getSimilarPeople(type, value, currentSlug);

  if (people.length === 0) {
    return null;
  }

  const sectionTitle = title || getSectionTitle(type, value);
  const sectionLinkHref = linkHref || getLinkHref(type, value);
  const sectionLinkText = linkText || getLinkText(type);

  return (
    <section className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">{sectionTitle}</h2>
        <Link
          href={sectionLinkHref}
          className="text-sm font-medium text-accent-primary hover:text-accent-secondary"
        >
          {sectionLinkText} →
        </Link>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((person) => (
          <Link
            key={person.fpid}
            href={`/people/${person.slug}`}
            className="group flex items-center gap-3 rounded-lg border border-surface-border bg-surface-bg p-3 transition hover:border-accent-primary hover:shadow-sm"
          >
            <Avatar src={person.image_url} alt={person.full_name} size="sm" />
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-sm font-semibold text-text-primary group-hover:text-accent-primary">
                {person.full_name}
              </h3>
              <p className="truncate text-xs text-text-secondary">
                {person.occupation?.slice(0, 2).join(', ') || '—'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
