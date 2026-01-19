import { SearchLayout } from '../../components/templates';
import { PersonCard } from '../../components/organisms';
import { SearchFilters, SearchPagination } from '../../components/organisms';
import { SearchHero } from '../../components/organisms';
import { searchPeople } from '../../lib/api/search';
import { buildPaginatedMetadata } from '../../lib/seo/canonical';
import { getSearchMetaDescription } from '../../lib/seo/meta-descriptions';
import type { Metadata } from 'next';

export async function generateMetadata({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }): Promise<Metadata> {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  const page = Number(searchParams.page || 1);
  const totalPages = 100;

  const hasFilters = !!(searchParams.country || searchParams.zodiac || searchParams.mbti || searchParams.sort);

  if (!q) {
    return {
      title: 'Search | FamousPeople.id',
      description: getSearchMetaDescription({ hasFilters }),
    };
  }

  const queryString = new URLSearchParams({ q }).toString();
  const path = `/search${queryString ? `?${queryString}` : ''}`;

  return {
    title: `Search results for "${q}" ${page > 1 ? `| Page ${page}` : ''} | FamousPeople.id`,
    description: getSearchMetaDescription({ query: q, hasFilters }),
    ...buildPaginatedMetadata({
      path,
      searchParams,
      currentPage: page,
      totalPages,
    }),
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Record<string, string | string[] | undefined> }) {
  const q = typeof searchParams.q === 'string' ? searchParams.q : '';
  if (!q) {
    return (
      <SearchLayout>
        <SearchHero query="" />
        <div className="rounded-xl border border-dashed border-surface-border p-8 text-center text-sm text-text-muted">
          Start typing to explore celebrities by name, occupation, or country.
        </div>
      </SearchLayout>
    );
  }

  const page = Number(searchParams.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await searchPeople({
    q,
    country: typeof searchParams.country === 'string' ? searchParams.country : undefined,
    zodiac: typeof searchParams.zodiac === 'string' ? searchParams.zodiac : undefined,
    mbti: typeof searchParams.mbti === 'string' ? searchParams.mbti : undefined,
    sort: typeof searchParams.sort === 'string' ? searchParams.sort : undefined,
    limit,
    offset,
  }).catch(() => ({ data: [], meta: { total: 0, page: 1, per_page: limit, has_next: false, facets: {} } }));

  const totalPages = Math.ceil(result.meta.total / limit) || 1;

  return (
    <SearchLayout>
      <SearchHero query={q} />

      <SearchFilters facets={result.meta.facets} totalResults={result.meta.total} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((person) => (
          <PersonCard key={person.fpid} {...person} showQuickFacts />
        ))}
      </div>

      {result.data.length === 0 && (
        <div className="rounded-xl border border-dashed border-surface-border p-8 text-center text-sm text-text-muted">
          No results found. Try adjusting your query.
        </div>
      )}

      <SearchPagination currentPage={page} totalPages={totalPages} />
    </SearchLayout>
  );
}
