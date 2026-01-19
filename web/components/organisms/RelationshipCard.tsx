import Link from 'next/link';
import { Badge } from '../atoms';

interface RelationshipCardProps {
  name: string;
  slug: string;
  relation: string;
  years?: string | null;
}

export function RelationshipCard({ name, slug, relation, years }: RelationshipCardProps) {
  return (
    <Link href={`/people/${slug}`} className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3 text-sm hover:border-brand-500">
      <div>
        <div className="font-semibold text-text-primary">{name}</div>
        <div className="text-xs text-text-muted">{years || '—'}</div>
      </div>
      <Badge variant="outline">{relation}</Badge>
    </Link>
  );
}
