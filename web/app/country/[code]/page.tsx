import { ListingLayout } from '../../../components/templates';
import { PersonCard } from '../../../components/organisms/PersonCard';
import { CategoryPaginationWrapper } from '../../../components/organisms/CategoryPaginationWrapper';
import { ItemListSchema } from '../../../components/seo/ItemListSchema';
import { getCategoryPeople } from '../../../lib/api/categories';
import { buildCategoryMetadata } from '../../../lib/seo/metadata';
import { buildPaginatedMetadata } from '../../../lib/seo/canonical';
import { buildBreadcrumbSchema } from '../../../lib/seo/schema';

// Generate static params for top countries only
export async function generateStaticParams() {
  const topCountries = ['united-states', 'united-kingdom', 'canada', 'australia', 'india', 'china', 'japan', 'south-korea', 'france', 'germany'];
  return topCountries.map((code) => ({ code }));
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Record<string, string | string[] | undefined> }) {
  const { code } = await params;
  const countryName = code.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const page = Number(searchParams?.page || 1);

  const result = await getCategoryPeople('country', countryName, 1, 0, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0 } }));
  const totalPages = Math.ceil(result.meta.total / 20) || 1;

  const baseMetadata = buildCategoryMetadata(`Famous People from ${countryName}`, `Explore celebrities from ${countryName}.`);
  const paginationMetadata = buildPaginatedMetadata({
    path: `/country/${code}`,
    searchParams,
    currentPage: page,
    totalPages,
  });

  if (page > 50) {
    return { ...baseMetadata, ...paginationMetadata, robots: 'noindex, nofollow' };
  }

  return { ...baseMetadata, ...paginationMetadata };
}

export default async function CountryPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Record<string, string | string[] | undefined> }) {
  const { code } = await params;
  const countryName = code.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const page = Number(searchParams.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getCategoryPeople('country', countryName, limit, offset, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0, page: 1, per_page: limit, has_next: false } }));

  const totalPages = Math.ceil(result.meta.total / limit) || 1;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'Countries', href: '/country' },
    { label: `Famous People from ${countryName}`, href: `/country/${code}` },
  ], siteUrl);

  return (
    <ListingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">Famous People from {countryName}</h1>
        <p className="mt-2 text-sm text-text-secondary">Browse celebrities associated with {countryName}.</p>
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
