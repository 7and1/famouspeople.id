import Link from 'next/link';
import clsx from 'clsx';

export function NavLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={clsx(
        'text-sm text-text-secondary transition hover:text-brand-700',
        active && 'text-text-primary font-semibold'
      )}
    >
      {label}
    </Link>
  );
}
