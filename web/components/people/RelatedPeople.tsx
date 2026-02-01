import Link from 'next/link';
import type { SimilarPerson } from '../../lib/api/people';

interface RelatedPeopleProps {
  people: SimilarPerson[];
  currentSlug: string;
}

function RelatedPersonCard({ person }: { person: SimilarPerson }) {
  return (
    <Link
      href={`/people/${person.slug}`}
      className="group flex items-center gap-3 rounded-lg border border-surface-border bg-white p-3 transition hover:border-primary/30 hover:shadow-sm"
    >
      <div className="relative size-12 flex-shrink-0 overflow-hidden rounded-full bg-surface-secondary">
        {person.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={person.image_url}
            alt={person.full_name}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-xs font-medium text-text-secondary">
            {person.full_name.charAt(0)}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="truncate text-sm font-medium text-text-primary group-hover:text-primary">
          {person.full_name}
        </h4>
        {person.bio_summary && (
          <p className="mt-0.5 line-clamp-1 text-xs text-text-secondary">
            {person.bio_summary}
          </p>
        )}
      </div>
    </Link>
  );
}

export function RelatedPeople({ people, currentSlug }: RelatedPeopleProps) {
  if (!people || people.length === 0) {
    return null;
  }

  const displayPeople = people.filter((p) => p.slug !== currentSlug).slice(0, 8);

  return (
    <section className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text-primary">Related People</h2>
        <span className="text-xs text-text-secondary">
          Based on similar profiles and interests
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {displayPeople.map((person) => (
          <RelatedPersonCard key={person.slug} person={person} />
        ))}
      </div>
    </section>
  );
}
