import { ListingLayout } from '../../../components/templates';
import { PersonCard, CategoryPagination } from '../../../components/organisms';
import { ItemListSchema } from '../../../components/seo/ItemListSchema';
import { getCategoryPeople } from '../../../lib/api/categories';
import { buildCategoryMetadata } from '../../../lib/seo/metadata';
import { buildPaginatedMetadata } from '../../../lib/seo/canonical';
import { getMbtiDescription } from '../../../lib/seo/meta-descriptions';
import type { Metadata } from 'next';

export async function generateMetadata({ params, searchParams }: { params: { type: string }; searchParams: Record<string, string | string[] | undefined> }): Promise<Metadata> {
  const type = params.type.toUpperCase();
  const description = getMbtiDescription(type);
  const baseMetadata = buildCategoryMetadata(`${type} Celebrities`, description);
  const page = Number(searchParams?.page || 1);

  if (page > 50) {
    return { ...baseMetadata, robots: 'noindex, nofollow' };
  }

  return {
    ...baseMetadata,
    ...buildPaginatedMetadata({
      path: `/mbti/${type.toLowerCase()}`,
      searchParams,
      currentPage: page,
      totalPages: 50,
    }),
  };
}

export default async function MbtiPage({ params, searchParams }: { params: { type: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const type = params.type.toUpperCase();
  const page = Number(searchParams.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getCategoryPeople('mbti', type, limit, offset, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0, page: 1, per_page: limit, has_next: false } }));

  const totalPages = Math.ceil(result.meta.total / limit) || 1;
  const description = getMbtiDescription(type);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{type} Celebrities</h1>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((person) => (
          <PersonCard key={person.fpid} {...person} showQuickFacts />
        ))}
      </div>
      <CategoryPagination currentPage={page} totalPages={totalPages} />
      <ItemListSchema items={result.data} offset={offset} siteUrl={siteUrl} />
    </ListingLayout>
  );
}
