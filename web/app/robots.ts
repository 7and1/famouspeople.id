import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
        crawlDelay: 1,
      },
      {
        userAgent: ['GPTBot', 'CCBot', 'ChatGPT-User', 'Google-Extended', 'anthropic-ai', 'Claude-Web'],
        disallow: '/',
      },
      {
        userAgent: ['AhrefsBot', 'SemrushBot', 'DotBot'],
        crawlDelay: 10,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
