import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { getServiceClient } from '../lib/db.js';
import { getSitemapPage } from '../services/sitemap.js';

const sitemap = new Hono<AppEnv>();

const escapeXml = (value: string) => value.replace(/[<>&'\"]/g, (char) => {
  switch (char) {
    case '<': return '&lt;';
    case '>': return '&gt;';
    case '&': return '&amp;';
    case '\"': return '&quot;';
    case "'": return '&apos;';
    default: return char;
  }
});

sitemap.get('/sitemap/:page', async (c) => {
  const pageNumber = Number(c.req.param('page'));
  if (!pageNumber || pageNumber < 1) {
    return c.text('Invalid sitemap page', 400);
  }

  const supabase = await getServiceClient();
  const { urls } = await getSitemapPage(supabase, pageNumber);
  const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  const body = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((entry) => {
      const loc = `${siteUrl}/people/${entry.slug}`;
      const lastmod = entry.lastmod ? new Date(entry.lastmod).toISOString().split('T')[0] : undefined;
      return `  <url>\n` +
        `    <loc>${escapeXml(loc)}</loc>\n` +
        (lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : '') +
        `    <changefreq>weekly</changefreq>\n` +
        `    <priority>0.8</priority>\n` +
        `  </url>`;
    }).join('\n') +
    `\n</urlset>`;

  c.header('Content-Type', 'application/xml');
  c.header('Cache-Control', 'public, max-age=3600');
  return c.text(body, 200);
});

export default sitemap;
