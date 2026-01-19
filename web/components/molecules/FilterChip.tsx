'use client';

import clsx from 'clsx';

interface FilterChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function FilterChip({ label, active = false, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full border px-3 py-1 text-xs transition',
        active
          ? 'border-brand-600 bg-brand-50 text-brand-700'
          : 'border-surface-border text-text-secondary hover:border-brand-600 hover:text-brand-700'
      )}
    >
      {label}
    </button>
  );
}
