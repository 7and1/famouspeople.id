import clsx from 'clsx';
import type { LabelHTMLAttributes } from 'react';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={clsx('text-xs font-medium uppercase tracking-wide text-text-muted', className)} {...props} />
  );
}
