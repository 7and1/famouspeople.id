import { NextResponse } from 'next/server';

export const runtime = 'edge';

export function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  return NextResponse.redirect(`${siteUrl}/.well-known/security.txt`, 308);
}

