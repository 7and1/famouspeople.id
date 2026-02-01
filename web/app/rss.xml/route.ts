import { NextResponse } from 'next/server';
import { buildInFilter, supabaseSelect } from '../../lib/supabase/rest';
import { getReleasedTiers } from '../../lib/utils/release';

export const runtime = 'edge';

interface RssItem {
  title: string;
  description: string;
  link: string;
  pubDate: string;
  guid: string;
  category?: string;
}

interface LatestPersonRss {
  fpid: string;
  slug: string;
  full_name: string;
  net_worth: number | null;
  height_cm: number | null;
  zodiac: string | null;
  mbti: string | null;
  occupation: string[];
  bio_summary: string | null;
  created_at: string | null;
  updated_at: string | null;
}

function generateRssFeed(items: RssItem[], title: string, description: string, link: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
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
      ${item.category ? `<category>${item.category}</category>` : ''}
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
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    ${itemsXml}
  </channel>
</rss>`;
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006/api/v1';
  const tiers = getReleasedTiers();

  try {
    let people: LatestPersonRss[] = [];

    try {
      const query = new URLSearchParams({
        select: 'fpid,slug,full_name,net_worth,height_cm,zodiac,mbti,occupation,bio_summary,created_at,updated_at,fame_tier,is_published',
        is_published: 'eq.true',
        fame_tier: buildInFilter(tiers),
        order: 'updated_at.desc.nullslast',
        limit: '50',
      });

      const { data } = await supabaseSelect<LatestPersonRss & { occupation: string[] | null }>('identities', query, {
        revalidateSeconds: 3600,
      });
      people = (data || []).map((row) => ({ ...row, occupation: row.occupation || [] }));
    } catch {
      // Fetch latest updated people from API
      const res = await fetch(`${apiUrl}/latest?limit=50`, { next: { revalidate: 3600 } });
      if (!res.ok) {
        throw new Error('Failed to fetch people data');
      }
      const data = await res.json();
      people = (data.data || []) as LatestPersonRss[];
    }

    const items: RssItem[] = people.map((person) => {
      const netWorth = person.net_worth
        ? `$${(person.net_worth / 1_000_000).toFixed(0)}M`
        : 'Unknown';
      const height = person.height_cm ? `${person.height_cm}cm` : '';
      const occupation = person.occupation?.[0] || 'Celebrity';
      const pubDate = new Date(person.updated_at || person.created_at || Date.now()).toUTCString();

      return {
        title: `${person.full_name} - ${occupation}`,
        description: `Net Worth: ${netWorth}${height ? ` | Height: ${height}` : ''}${person.zodiac ? ` | Zodiac: ${person.zodiac}` : ''}${person.mbti ? ` | MBTI: ${person.mbti}` : ''}. ${person.bio_summary || ''}`,
        link: `${siteUrl}/people/${person.slug}`,
        pubDate,
        guid: `${siteUrl}/people/${person.slug}`,
        category: occupation,
      };
    });

    const rss = generateRssFeed(
      items,
      'FamousPeople.id - Latest Celebrity Profile Updates',
      'Discover the latest updated celebrity profiles with net worth, height, zodiac signs, MBTI types, and more.',
      siteUrl
    );

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    // Return empty feed on error
    const rss = generateRssFeed(
      [],
      'FamousPeople.id - Latest Celebrity Profile Updates',
      'Discover the latest updated celebrity profiles with net worth, height, zodiac signs, MBTI types, and more.',
      siteUrl
    );

    return new NextResponse(rss, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }
}
