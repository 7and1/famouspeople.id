'use client';

import { useRouter } from 'next/navigation';
import { SearchBox } from '../molecules/SearchBox';

export function HomeSearch() {
  const router = useRouter();

  return (
    <SearchBox
      variant="hero"
      onSubmit={(value) => {
        if (!value) return;
        router.push(`/search?q=${encodeURIComponent(value)}`);
      }}
    />
  );
}
