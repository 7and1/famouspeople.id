import { NextResponse } from 'next/server';
import type { PersonSummary, RankingItem } from '../../../lib/api/types';
import { buildInFilter, supabaseSelect } from '../../../lib/supabase/rest';
import { getReleasedTiers } from '../../../lib/utils/release';

export const runtime = 'edge';

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
}

function generateRssFeed(items: RssItem[], title: string, description: string, link: string) {
  const currentDate = new Date().toUTCString();

  const itemsXml = items
    .map(
      (item) => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.link}</link>
      <pubDate>${item.pubDate}</pubDate>
      <guid isPermaLink="true">${item.guid}</guid>
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${title}</title>
    <description>${description}</description>
    <link>${link}</link>
    <language>en</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <atom:link href="${link}" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;
}

const isRankingItem = (item: PersonSummary | RankingItem): item is RankingItem => {
  return typeof (item as RankingItem).rank === 'number';
};

const categoryConfig: Record<string, { title: string; description: string; apiPath: string }> = {
  'richest': {
    title: 'FamousPeople.id - Richest Celebrities',
    description: 'Latest updates on the wealthiest celebrities and their net worth rankings.',
    apiPath: '/rankings/net-worth',
  },
  'tallest': {
    title: 'FamousPeople.id - Tallest Celebrities',
    description: 'Discover the tallest celebrities across film, sports, and entertainment.',
    apiPath: '/rankings/height',
  },
  'actors': {
    title: 'FamousPeople.id - Actors',
    description: 'Latest profiles of famous actors and actresses.',
    apiPath: '/categories/occupation/actor',
  },
  'musicians': {
    title: 'FamousPeople.id - Musicians',
    description: 'Latest profiles of singers, bands, and music artists.',
    apiPath: '/categories/occupation/singer',
  },
  'athletes': {
    title: 'FamousPeople.id - Athletes',
    description: 'Latest profiles of sports stars and athletes.',
    apiPath: '/categories/occupation/athlete',
  },
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006/api/v1';
  const tiers = getReleasedTiers();
  const { category } = await params;

  const config = categoryConfig[category];

  if (!config) {
    return new NextResponse('Category not found', { status: 404 });
  }

  try {
    let people: Array<PersonSummary | RankingItem> = [];

    try {
      // Supabase REST fallback (keeps RSS alive even if API is unreachable)
      const baseQuery = new URLSearchParams({
        select: 'fpid,slug,full_name,net_worth,height_cm,birth_date,occupation,country,zodiac,mbti,image_url',
        is_published: 'eq.true',
        fame_tier: buildInFilter(tiers),
        limit: '50',
      });

      if (category === 'richest') {
        baseQuery.set('order', 'net_worth.desc.nullslast');
      } else if (category === 'tallest') {
        baseQuery.set('order', 'height_cm.desc.nullslast');
      } else if (category === 'actors') {
        baseQuery.set('occupation', 'cs.{actor}');
        baseQuery.set('order', 'net_worth.desc.nullslast');
      } else if (category === 'musicians') {
        baseQuery.set('occupation', 'cs.{singer}');
        baseQuery.set('order', 'net_worth.desc.nullslast');
      } else if (category === 'athletes') {
        baseQuery.set('occupation', 'cs.{athlete}');
        baseQuery.set('order', 'net_worth.desc.nullslast');
      } else {
        throw new Error('No supabase fallback mapping');
      }

      const { data } = await supabaseSelect<PersonSummary & { occupation: string[] | null; country: string[] | null }>(
        'identities',
        baseQuery,
        { revalidateSeconds: 3600 }
      );

      people = (data || []).map((row) => ({
        ...row,
        occupation: row.occupation || [],
        country: row.country || [],
      }));
    } catch {
      const res = await fetch(`${apiUrl}${config.apiPath}?limit=50`, {
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch category data');
      }

      const data = await res.json();
      people = (data.data || []) as Array<PersonSummary | RankingItem>;
    }

    const now = new Date().toUTCString();

    const items: RssItem[] = people.map((person) => {
      if (isRankingItem(person)) {
        const metric = person.formatted_value || (person.value !== null ? String(person.value) : 'Unknown');
        return {
          title: `${person.full_name} - #${person.rank}`,
          description: `Rank #${person.rank}. Metric: ${metric}. Explore profile facts on FamousPeople.id.`,
          link: `${siteUrl}/people/${person.slug}`,
          pubDate: now,
          guid: `${siteUrl}/people/${person.slug}`,
        };
      }

      const netWorth = person.net_worth
        ? `$${(person.net_worth / 1_000_000).toFixed(0)}M`
        : 'Unknown';
      const height = person.height_cm ? `${person.height_cm}cm` : '';
      const occupation = person.occupation?.[0] || 'Celebrity';

      return {
        title: `${person.full_name} - ${occupation}`,
        description: `Net Worth: ${netWorth}${height ? ` | Height: ${height}` : ''}${person.zodiac ? ` | Zodiac: ${person.zodiac}` : ''}${person.mbti ? ` | MBTI: ${person.mbti}` : ''}.`,
        link: `${siteUrl}/people/${person.slug}`,
        pubDate: now,
        guid: `${siteUrl}/people/${person.slug}`,
      };
    });

    const rss = generateRssFeed(items, config.title, config.description, `${siteUrl}/rss/${category}`);

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    const rss = generateRssFeed([], config.title, config.description, `${siteUrl}/rss/${category}`);

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
