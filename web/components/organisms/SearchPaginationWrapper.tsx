import { Suspense } from 'react';
import { SearchPagination } from './SearchPagination';

export function SearchPaginationWrapper({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <Suspense fallback={<div className="h-12" />}>
      <SearchPagination currentPage={currentPage} totalPages={totalPages} />
    </Suspense>
  );
}
