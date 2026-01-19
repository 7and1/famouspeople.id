import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md';
}

export function Badge({ variant = 'secondary', size = 'md', className, ...props }: BadgeProps) {
  const base = 'inline-flex items-center rounded-full font-medium';
  const variants: Record<string, string> = {
    primary: 'bg-brand-600 text-white',
    secondary: 'bg-surface-subtle text-text-secondary',
    outline: 'border border-surface-border text-text-secondary',
  };
  const sizes: Record<string, string> = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };
  return <span className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
