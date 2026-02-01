import { Suspense } from 'react';
import { SearchFilters } from './SearchFilters';
import type { SearchFacets } from '../../lib/api/types';

export function SearchFiltersWrapper({ facets, totalResults }: { facets?: SearchFacets; totalResults: number }) {
  return (
    <Suspense fallback={<div className="h-12" />}>
      <SearchFilters facets={facets} totalResults={totalResults} />
    </Suspense>
  );
}
