import type { ImageLoaderProps } from 'next/image';

/**
 * Cloudflare Images loader for optimized image delivery
 * Uses Cloudflare Image Resizing service for format optimization and caching
 */
export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto'];

  // If using Cloudflare Image Resizing with a custom domain
  if (src.startsWith('https://cdn.famouspeople.id') || src.startsWith('https://images.famouspeople.id')) {
    return `${src}?${params.join('&')}`;
  }

  // For external images (Wikipedia, etc.), use Cloudflare's on-the-fly resizing
  // This requires Cloudflare Image Resizing to be enabled on the zone
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  return `${siteUrl}/cdn-cgi/image/${params.join(',')}/${encodeURIComponent(src)}`;
}
