const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

export interface CanonicalUrlOptions {
  path: string;
  searchParams?: Record<string, string | string[] | undefined>;
  pageParam?: string;
}

/**
 * Builds a canonical URL for paginated pages.
 * - Page 1: Returns clean URL without page parameter
 * - Page 2+: Returns URL with page parameter
 */
export function buildCanonicalUrl({ path, searchParams = {}, pageParam = 'page' }: CanonicalUrlOptions): string {
  const url = new URL(path, SITE_URL);

  const page = searchParams[pageParam];
  const pageNum = page ? Number(page) : 1;

  // Only include page parameter if greater than 1
  if (pageNum > 1) {
    url.searchParams.set(pageParam, String(pageNum));
  }

  return url.toString();
}

/**
 * Builds pagination links (next/prev) for SEO.
 */
export interface PaginationLinks {
  prev?: string;
  next?: string;
}

export function buildPaginationLinks({
  path,
  currentPage,
  totalPages,
  pageParam = 'page',
}: CanonicalUrlOptions & { currentPage: number; totalPages: number }): PaginationLinks {
  const links: PaginationLinks = {};

  if (currentPage > 1) {
    const prevPage = currentPage - 1;
    const prevUrl = new URL(path, SITE_URL);
    if (prevPage > 1) {
      prevUrl.searchParams.set(pageParam, String(prevPage));
    }
    links.prev = prevUrl.toString();
  }

  if (currentPage < totalPages) {
    const nextPage = currentPage + 1;
    const nextUrl = new URL(path, SITE_URL);
    nextUrl.searchParams.set(pageParam, String(nextPage));
    links.next = nextUrl.toString();
  }

  return links;
}

/**
 * Combines canonical URL and pagination links for Next.js metadata.
 */
export function buildPaginatedMetadata({
  path,
  searchParams = {},
  currentPage,
  totalPages,
  pageParam = 'page',
}: CanonicalUrlOptions & { currentPage: number; totalPages: number }) {
  const canonical = buildCanonicalUrl({ path, searchParams, pageParam });
  const links = buildPaginationLinks({ path, currentPage, totalPages, pageParam });

  return {
    alternates: {
      canonical,
      ...(links.prev && { prev: links.prev }),
      ...(links.next && { next: links.next }),
    },
  };
}
