import { ListingLayout } from '../../../components/templates';
import { PersonCard, CategoryPagination } from '../../../components/organisms';
import { ItemListSchema } from '../../../components/seo/ItemListSchema';
import { getCategoryPeople } from '../../../lib/api/categories';
import { buildCategoryMetadata } from '../../../lib/seo/metadata';

export async function generateMetadata({ params, searchParams }: { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const name = params.slug.replace(/-/g, ' ');
  const metadata = buildCategoryMetadata(`${name} Celebrities`, `Explore famous ${name} celebrities.`);
  const page = Number(searchParams?.page || 1);
  if (page > 50) {
    return { ...metadata, robots: 'noindex, nofollow' };
  }
  return metadata;
}

export default async function OccupationPage({ params, searchParams }: { params: { slug: string }; searchParams: Record<string, string | string[] | undefined> }) {
  const occupation = params.slug.replace(/-/g, ' ');
  const page = Number(searchParams.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getCategoryPeople('occupation', occupation, limit, offset, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0, page: 1, per_page: limit, has_next: false } }));

  const totalPages = Math.ceil(result.meta.total / limit) || 1;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  return (
    <ListingLayout>
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
