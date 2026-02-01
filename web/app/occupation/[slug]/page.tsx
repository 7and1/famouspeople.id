import { ListingLayout } from '../../../components/templates';
import { PersonCard } from '../../../components/organisms/PersonCard';
import { CategoryPagination } from '../../../components/organisms/CategoryPagination';
import { ItemListSchema } from '../../../components/seo/ItemListSchema';
import { getCategoryPeople } from '../../../lib/api/categories';
import { buildCategoryMetadata } from '../../../lib/seo/metadata';
import { buildPaginatedMetadata } from '../../../lib/seo/canonical';
import { buildBreadcrumbSchema } from '../../../lib/seo/schema';

// Generate static params for top occupations only
export async function generateStaticParams() {
  const topOccupations = ['actor', 'musician', 'athlete', 'politician', 'entrepreneur', 'singer', 'director', 'writer', 'model', 'comedian'];
  return topOccupations.map((slug) => ({ slug }));
}

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Record<string, string | string[] | undefined> }) {
  const { slug } = await params;
  const name = slug.replace(/-/g, ' ');
  const page = Number(searchParams?.page || 1);

  const result = await getCategoryPeople('occupation', name, 1, 0, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0 } }));
  const totalPages = Math.ceil(result.meta.total / 20) || 1;

  const baseMetadata = buildCategoryMetadata(`${name} Celebrities`, `Explore famous ${name} celebrities.`);
  const paginationMetadata = buildPaginatedMetadata({
    path: `/occupation/${slug}`,
    searchParams,
    currentPage: page,
    totalPages,
  });

  if (page > 50) {
    return { ...baseMetadata, ...paginationMetadata, robots: 'noindex, nofollow' };
  }

  return { ...baseMetadata, ...paginationMetadata };
}

export default async function OccupationPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Record<string, string | string[] | undefined> }) {
  const { slug } = await params;
  const occupation = slug.replace(/-/g, ' ');
  const page = Number(searchParams.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getCategoryPeople('occupation', occupation, limit, offset, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0, page: 1, per_page: limit, has_next: false } }));

  const totalPages = Math.ceil(result.meta.total / limit) || 1;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'Occupations', href: '/occupation' },
    { label: `${occupation} Celebrities`, href: `/occupation/${slug}` },
  ], siteUrl);

  return (
    <ListingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{occupation} Celebrities</h1>
        <p className="mt-2 text-sm text-text-secondary">Explore famous people known for {occupation}.</p>
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
