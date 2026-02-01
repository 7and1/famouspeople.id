import clsx from 'clsx';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        'w-full rounded-md border border-surface-border bg-white px-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30',
        className
      )}
      {...props}
    />
  );
}
