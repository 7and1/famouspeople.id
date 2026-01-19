'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const links = [
  { href: '/search', label: 'Search' },
  { href: '/richest', label: 'Rankings' },
  { href: '/compare', label: 'Compare' },
];

export function Navigation() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-6 text-sm text-text-secondary">
      {links.map((link) => {
        const isActive = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'transition hover:text-brand-700',
              isActive && 'text-text-primary font-semibold'
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
