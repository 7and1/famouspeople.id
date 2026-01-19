import { Badge } from '../atoms/Badge';

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  accent?: string;
}

export function StatCard({ label, value, description, accent }: StatCardProps) {
  return (
    <div className="rounded-xl border border-surface-border bg-white p-4 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{label}</span>
        {accent ? <Badge variant="outline">{accent}</Badge> : null}
      </div>
      <div className="mt-3 text-2xl font-semibold text-text-primary">{value}</div>
      {description ? <p className="mt-2 text-xs text-text-secondary">{description}</p> : null}
    </div>
  );
}
