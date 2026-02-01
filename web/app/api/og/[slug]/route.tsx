import { ImageResponse } from '@vercel/og';

export const runtime = 'edge';

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006/api/v1';
  const res = await fetch(`${apiUrl}/people/${slug}`, { next: { revalidate: 86400 } });
  const payload = res.ok ? await res.json() : null;
  const person = payload?.data;

  const title = person?.full_name || 'FamousPeople.id';
  const subtitle = person?.occupation?.slice(0, 2).join(' · ') || 'Celebrity Profile';
  const netWorth = person?.net_worth ? `$${Number(person.net_worth / 1_000_000_000).toFixed(1)}B` : 'Net Worth';

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: 'linear-gradient(135deg, #e0f2fe, #ffffff)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ fontSize: 58, fontWeight: 700, color: '#0f172a' }}>{title}</div>
        <div style={{ marginTop: 16, fontSize: 28, color: '#475569' }}>{subtitle}</div>
        <div style={{ marginTop: 40, fontSize: 32, color: '#0284c7' }}>{netWorth}</div>
        <div style={{ marginTop: 60, fontSize: 22, color: '#0369a1' }}>FamousPeople.id</div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
