import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006/api/v1';
  const res = await fetch(`${apiUrl}/sitemap/1`, { next: { revalidate: 3600 } });

  if (!res.ok) {
    return new NextResponse('Failed to load sitemap', { status: 500 });
  }

  const xml = await res.text();
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
