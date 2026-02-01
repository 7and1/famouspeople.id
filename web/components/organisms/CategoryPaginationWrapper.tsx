import { Suspense } from 'react';
import { CategoryPagination } from './CategoryPagination';

export function CategoryPaginationWrapper({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return (
    <Suspense fallback={<div className="h-12" />}>
      <CategoryPagination currentPage={currentPage} totalPages={totalPages} />
    </Suspense>
  );
}
