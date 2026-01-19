import { Label } from '../atoms/Label';
import { ExternalLink } from 'lucide-react';

interface FactWithCitationProps {
  label: string;
  value?: string | number | null;
  sourceUrl?: string;
  sourceName?: string;
  lastUpdated?: string;
}

export function FactWithCitation({
  label,
  value,
  sourceUrl,
  sourceName,
  lastUpdated,
}: FactWithCitationProps) {
  return (
    <div className="rounded-lg border border-surface-border bg-white px-4 py-3 shadow-sm">
      <Label>{label}</Label>
      <div className="mt-2 text-sm font-semibold text-text-primary">
        {value ?? '—'}
      </div>
      {(sourceUrl || sourceName) && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="nofollow noreferrer noopener"
          className="mt-2 flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          aria-label={`Source for ${label}: ${sourceName}`}
        >
          <span>{sourceName || 'Source'}</span>
          <ExternalLink className="h-3 w-3" strokeWidth={2} />
          {lastUpdated && (
            <span className="text-text-muted/70">
              {' '}· Updated {lastUpdated}
            </span>
          )}
        </a>
      )}
    </div>
  );
}
