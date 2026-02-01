import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  const body = [
    'Contact: mailto:hello@famouspeople.id',
    `Canonical: ${siteUrl}/.well-known/security.txt`,
    `Policy: ${siteUrl}/terms`,
    'Preferred-Languages: en',
    'Expires: 2026-12-31T00:00:00.000Z',
    '',
  ].join('\n');

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

