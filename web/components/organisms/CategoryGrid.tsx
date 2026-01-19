import Link from 'next/link';

interface CategoryItem {
  title: string;
  description: string;
  href: string;
}

export function CategoryGrid({ items }: { items: CategoryItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-xl border border-surface-border bg-white p-4 shadow-sm transition hover:border-brand-500"
        >
          <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
          <p className="mt-2 text-sm text-text-secondary">{item.description}</p>
        </Link>
      ))}
    </div>
  );
}
