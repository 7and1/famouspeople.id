'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { FilterBar } from './FilterBar';

export function SearchFilters({ facets, totalResults }: { facets: any; totalResults: number }) {
  const router = useRouter();
  const params = useSearchParams();

  const active: Record<string, string | null> = {
    Country: params.get('country'),
    Zodiac: params.get('zodiac'),
  };

  const groups = [
    {
      label: 'Country',
      options: (facets?.country || []).map((item: any) => item.value),
    },
    {
      label: 'Zodiac',
      options: (facets?.zodiac || []).map((item: any) => item.value),
    },
  ].filter((group) => group.options.length > 0);

  return (
    <FilterBar
      groups={groups}
      active={active}
      totalResults={totalResults}
      onChange={(group, value) => {
        const next = new URLSearchParams(params.toString());
        if (!value) {
          next.delete(group.toLowerCase());
        } else {
          next.set(group.toLowerCase(), value);
        }
        router.push(`/search?${next.toString()}`);
      }}
    />
  );
}
