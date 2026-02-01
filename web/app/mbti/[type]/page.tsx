import { ListingLayout } from '../../../components/templates';
import { PersonCard } from '../../../components/organisms/PersonCard';
import { CategoryPaginationWrapper } from '../../../components/organisms/CategoryPaginationWrapper';
import { ItemListSchema } from '../../../components/seo/ItemListSchema';
import { getCategoryPeople } from '../../../lib/api/categories';
import { buildCategoryMetadata } from '../../../lib/seo/metadata';
import { buildPaginatedMetadata } from '../../../lib/seo/canonical';
import { buildBreadcrumbSchema } from '../../../lib/seo/schema';
import { getMbtiDescription } from '../../../lib/seo/meta-descriptions';
import type { Metadata } from 'next';

const mbtiTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];

export async function generateStaticParams() {
  return mbtiTypes.map((type) => ({ type: type.toLowerCase() }));
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Record<string, string | string[] | undefined> }): Promise<Metadata> {
  const { type } = await params;
  const description = getMbtiDescription(type);
  const baseMetadata = buildCategoryMetadata(`${type} Celebrities`, description);
  const page = Number(searchParams?.page || 1);

  const result = await getCategoryPeople('mbti', type, 1, 0, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0 } }));
  const totalPages = Math.ceil(result.meta.total / 20) || 1;

  if (page > 50) {
    return { ...baseMetadata, robots: 'noindex, nofollow' };
  }

  return {
    ...baseMetadata,
    ...buildPaginatedMetadata({
      path: `/mbti/${type.toLowerCase()}`,
      searchParams,
      currentPage: page,
      totalPages,
    }),
  };
}

export default async function MbtiPage({ params, searchParams }: { params: Promise<{ type: string }>; searchParams: Record<string, string | string[] | undefined> }) {
  const { type } = await params;
  const page = Number(searchParams.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getCategoryPeople('mbti', type, limit, offset, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0, page: 1, per_page: limit, has_next: false } }));

  const totalPages = Math.ceil(result.meta.total / limit) || 1;
  const description = getMbtiDescription(type);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'MBTI Types', href: '/mbti' },
    { label: `${type} Celebrities`, href: `/mbti/${type.toLowerCase()}` },
  ], siteUrl);

  return (
    <ListingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{type} Celebrities</h1>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {result.data.map((person) => (
          <PersonCard key={person.fpid} {...person} showQuickFacts />
        ))}
      </div>
      <CategoryPaginationWrapper currentPage={page} totalPages={totalPages} />
      <ItemListSchema items={result.data} offset={offset} siteUrl={siteUrl} />
    </ListingLayout>
  );
}
