import { NextResponse } from 'next/server';
import { buildUrlsetXml, formatLastmod } from '../../../../lib/seo/sitemap';
import { buildInFilter, supabaseSelect } from '../../../../lib/supabase/rest';
import { getReleasedTiers } from '../../../../lib/utils/release';

export const runtime = 'edge';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ page: string }> }
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006/api/v1';
  const tiers = getReleasedTiers();
  const perPage = 50000;

  const { page: pageParam } = await params;
  const page = Number(pageParam);
  if (!page || page < 1) {
    return new NextResponse('Invalid sitemap page', { status: 400 });
  }

  try {
    let people: Array<{
      slug: string;
      full_name: string;
      image_url: string | null;
      occupation?: string[];
      updated_at?: string | null;
      created_at?: string | null;
    }> = [];

    try {
      const offset = (page - 1) * perPage;
      const query = new URLSearchParams({
        select: 'slug,updated_at,created_at,full_name,image_url,occupation',
        is_published: 'eq.true',
        fame_tier: buildInFilter(tiers),
        order: 'updated_at.desc.nullslast',
        limit: String(perPage),
        offset: String(offset),
      });

      const { data } = await supabaseSelect<{
        slug: string;
        full_name: string;
        image_url: string | null;
        occupation: string[] | null;
        updated_at: string | null;
        created_at: string | null;
      }>('identities', query, { revalidateSeconds: 3600 });

      people = (data || []).map((row) => ({
        slug: row.slug,
        full_name: row.full_name,
        image_url: row.image_url,
        occupation: row.occupation || [],
        updated_at: row.updated_at,
        created_at: row.created_at,
      }));
    } catch {
      const res = await fetch(`${apiUrl}/sitemap-data/${page}`, { next: { revalidate: 3600 } });
      if (!res.ok) throw new Error('Failed to load sitemap data');
      const data = await res.json();
      people = (data?.people || []) as Array<{
        slug: string;
        full_name: string;
        image_url: string | null;
        occupation?: string[];
        updated_at?: string | null;
        created_at?: string | null;
      }>;
    }

    const urls = people.map((person) => {
      const images = person.image_url
        ? [
            {
              loc: person.image_url,
              title: person.full_name,
              caption: `${person.full_name} - ${person.occupation?.[0] || 'Celebrity'}`,
            },
          ]
        : undefined;

      return {
        loc: `/people/${person.slug}`,
        lastmod: formatLastmod(person.updated_at || person.created_at),
        changefreq: 'weekly' as const,
        priority: 0.8,
        images,
      };
    });

    const xml = buildUrlsetXml(urls, siteUrl);

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    const xml = buildUrlsetXml([], siteUrl);
    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
