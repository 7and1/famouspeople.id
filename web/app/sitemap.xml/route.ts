import { NextResponse } from 'next/server';
import { buildSitemapIndexXml, formatLastmod } from '../../lib/seo/sitemap';
import { buildInFilter, supabaseSelect } from '../../lib/supabase/rest';
import { getReleasedTiers } from '../../lib/utils/release';

export const runtime = 'edge';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006/api/v1';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  try {
    const perPage = 50000;
    const tiers = getReleasedTiers();

    let totalPages = 1;

    try {
      const query = new URLSearchParams({
        select: 'slug',
        limit: '1',
        is_published: 'eq.true',
        fame_tier: buildInFilter(tiers),
      });
      const { total } = await supabaseSelect<{ slug: string }>('identities', query, {
        countExact: true,
        revalidateSeconds: 3600,
      });
      if (typeof total === 'number') {
        totalPages = Math.max(1, Math.ceil(total / perPage));
      }
    } catch {
      const res = await fetch(`${apiUrl}/sitemap-data/1`, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error('Failed to load sitemap data from API');
      const data = await res.json();
      totalPages = Number(data?.meta?.total_pages || 1);
    }

    const entries = [
      { loc: '/sitemaps/static.xml', lastmod: formatLastmod(new Date().toISOString()) },
      ...(totalPages >= 1
        ? Array.from({ length: totalPages }, (_, idx) => ({
            loc: `/sitemaps/people/${idx + 1}`,
            lastmod: formatLastmod(new Date().toISOString()),
          }))
        : [{ loc: '/sitemaps/people/1', lastmod: formatLastmod(new Date().toISOString()) }]),
    ];

    const sitemap = buildSitemapIndexXml(entries, siteUrl);

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    const entries = [
      { loc: '/sitemaps/static.xml' },
      { loc: '/sitemaps/people/1' },
    ];
    const sitemap = buildSitemapIndexXml(entries, siteUrl);

    return new NextResponse(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
