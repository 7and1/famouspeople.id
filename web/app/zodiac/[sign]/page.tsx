import { ListingLayout } from '../../../components/templates';
import { PersonCard } from '../../../components/organisms/PersonCard';
import { CategoryPaginationWrapper } from '../../../components/organisms/CategoryPaginationWrapper';
import { ItemListSchema } from '../../../components/seo/ItemListSchema';
import { getCategoryPeople } from '../../../lib/api/categories';
import { buildCategoryMetadata } from '../../../lib/seo/metadata';
import { buildPaginatedMetadata } from '../../../lib/seo/canonical';
import { buildBreadcrumbSchema } from '../../../lib/seo/schema';
import { ZODIAC_DESCRIPTIONS } from '../../../lib/seo/meta-descriptions';
import type { Metadata } from 'next';

const zodiacSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

export async function generateStaticParams() {
  return zodiacSigns.map((sign) => ({ sign }));
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ sign: string }>; searchParams: Record<string, string | string[] | undefined> }): Promise<Metadata> {
  const { sign } = await params;
  const title = `Famous ${sign.charAt(0).toUpperCase() + sign.slice(1)} Celebrities`;
  const description = ZODIAC_DESCRIPTIONS[sign] || 'Explore celebrities by zodiac sign.';
  const page = Number(searchParams?.page || 1);

  const result = await getCategoryPeople('zodiac', sign.charAt(0).toUpperCase() + sign.slice(1), 1, 0, 'net_worth:desc').catch(() => ({ data: [], meta: { total: 0 } }));
  const totalPages = Math.ceil(result.meta.total / 20) || 1;

  if (page > 50) {
    return { ...buildCategoryMetadata(title, description), robots: 'noindex, nofollow' };
  }

  return {
    ...buildCategoryMetadata(title, description),
    ...buildPaginatedMetadata({
      path: `/zodiac/${sign}`,
      searchParams,
      currentPage: page,
      totalPages,
    }),
  };
}

export default async function ZodiacPage({ params, searchParams }: { params: Promise<{ sign: string }>; searchParams: Record<string, string | string[] | undefined> }) {
  const { sign } = await params;
  const page = Number(searchParams.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const result = await getCategoryPeople(
    'zodiac',
    sign.charAt(0).toUpperCase() + sign.slice(1),
    limit,
    offset,
    'net_worth:desc'
  ).catch(() => ({ data: [], meta: { total: 0, page: 1, per_page: limit, has_next: false } }));

  const totalPages = Math.ceil(result.meta.total / limit) || 1;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'Zodiac Signs', href: '/zodiac' },
    { label: `${sign.charAt(0).toUpperCase() + sign.slice(1)} Celebrities`, href: `/zodiac/${sign}` },
  ], siteUrl);

  return (
    <ListingLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{sign.charAt(0).toUpperCase() + sign.slice(1)} Celebrities</h1>
        <p className="mt-2 text-sm text-text-secondary">{ZODIAC_DESCRIPTIONS[sign] || 'Explore celebrities by zodiac sign.'}</p>
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
