import { Label } from '../atoms/Label';

interface FactItemProps {
  label: string;
  value?: string | number | null;
}

export function FactItem({ label, value }: FactItemProps) {
  return (
    <div className="rounded-lg border border-surface-border bg-white px-4 py-3 shadow-sm">
      <Label>{label}</Label>
      <div className="mt-2 text-sm font-semibold text-text-primary">
        {value ?? '—'}
      </div>
    </div>
  );
}
