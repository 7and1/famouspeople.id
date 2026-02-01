import { NextResponse } from 'next/server';
import { buildUrlsetXml } from '../../../lib/seo/sitemap';

export const runtime = 'edge';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  const zodiacSigns = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
  const mbtiTypes = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'];
  const topOccupations = ['actor', 'musician', 'athlete', 'entrepreneur', 'politician', 'director', 'writer', 'scientist', 'model', 'comedian'];
  const topCountries = ['united-states', 'united-kingdom', 'canada', 'australia', 'india', 'france', 'germany', 'italy', 'spain', 'japan'];
  const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

  const urls = [
    { loc: '/', changefreq: 'daily' as const, priority: 1.0 },
    { loc: '/people', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/search', changefreq: 'daily' as const, priority: 0.8 },
    { loc: '/richest', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/tallest', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/birthday-today', changefreq: 'daily' as const, priority: 0.9 },
    { loc: '/compare', changefreq: 'weekly' as const, priority: 0.7 },

    // Category hub pages
    { loc: '/zodiac', changefreq: 'weekly' as const, priority: 0.8 },
    { loc: '/mbti', changefreq: 'weekly' as const, priority: 0.8 },
    { loc: '/occupation', changefreq: 'weekly' as const, priority: 0.8 },
    { loc: '/country', changefreq: 'weekly' as const, priority: 0.8 },

    // All zodiac signs
    ...zodiacSigns.map(sign => ({ loc: `/zodiac/${sign}`, changefreq: 'weekly' as const, priority: 0.8 })),

    // All MBTI types
    ...mbtiTypes.map(type => ({ loc: `/mbti/${type.toLowerCase()}`, changefreq: 'weekly' as const, priority: 0.8 })),

    // Top occupations
    ...topOccupations.map(occ => ({ loc: `/occupation/${occ}`, changefreq: 'weekly' as const, priority: 0.8 })),

    // Top countries
    ...topCountries.map(country => ({ loc: `/country/${country}`, changefreq: 'weekly' as const, priority: 0.8 })),

    // All birthday months
    ...months.map(month => ({ loc: `/birthday/${month}`, changefreq: 'weekly' as const, priority: 0.7 })),

    // Legal pages
    { loc: '/about', changefreq: 'monthly' as const, priority: 0.4 },
    { loc: '/privacy', changefreq: 'yearly' as const, priority: 0.3 },
    { loc: '/terms', changefreq: 'yearly' as const, priority: 0.3 },

    // RSS feed
    { loc: '/rss.xml', changefreq: 'hourly' as const, priority: 0.4 },
  ];

  const xml = buildUrlsetXml(urls, siteUrl);

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
