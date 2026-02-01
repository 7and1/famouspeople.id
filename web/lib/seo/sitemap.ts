export interface SitemapImage {
  loc: string;
  caption?: string;
  title?: string;
}

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: SitemapImage[];
}

export interface SitemapIndexEntry {
  loc: string;
  lastmod?: string;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatLastmod(input?: string | null): string | undefined {
  if (!input) return undefined;
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().split('T')[0];
}

export function buildUrlsetXml(urls: SitemapUrl[], siteUrl: string): string {
  const hasImages = urls.some((u) => (u.images?.length ?? 0) > 0);
  const urlEntries = urls
    .map((url) => {
      const fullUrl = url.loc.startsWith('http') ? url.loc : `${siteUrl}${url.loc}`;
      const imageEntries = url.images
        ?.map((img) => {
          const loc = escapeXml(img.loc);
          const caption = img.caption ? `<image:caption>${escapeXml(img.caption)}</image:caption>` : '';
          const title = img.title ? `<image:title>${escapeXml(img.title)}</image:title>` : '';
          return `
      <image:image>
        <image:loc>${loc}</image:loc>
        ${caption}
        ${title}
      </image:image>`;
        })
        .join('');

      return `
    <url>
      <loc>${escapeXml(fullUrl)}</loc>
      ${url.lastmod ? `<lastmod>${escapeXml(url.lastmod)}</lastmod>` : ''}
      ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
      ${url.priority !== undefined ? `<priority>${url.priority.toFixed(1)}</priority>` : ''}
      ${imageEntries || ''}
    </url>`;
    })
    .join('');

  const imageNs = hasImages ? '\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' : '';

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"${imageNs}>` +
    `${urlEntries}\n</urlset>`;
}

export function buildSitemapIndexXml(entries: SitemapIndexEntry[], siteUrl: string): string {
  const sitemapEntries = entries
    .map((entry) => {
      const fullUrl = entry.loc.startsWith('http') ? entry.loc : `${siteUrl}${entry.loc}`;
      return `
  <sitemap>
    <loc>${escapeXml(fullUrl)}</loc>
    ${entry.lastmod ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''}
  </sitemap>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">` +
    `${sitemapEntries}\n</sitemapindex>`;
}

