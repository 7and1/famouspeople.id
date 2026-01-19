'use client';

import { useRouter } from 'next/navigation';
import { SearchBox } from '../molecules/SearchBox';

export function SearchHero({ query }: { query: string }) {
  const router = useRouter();
  return (
    <SearchBox
      value={query}
      variant="hero"
      onSubmit={(value) => {
        if (!value) return;
        router.push(`/search?q=${encodeURIComponent(value)}`);
      }}
    />
  );
}
