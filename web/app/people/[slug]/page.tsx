import dynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumb, FactWithCitation } from '../../../components/molecules';
import { PersonHeader } from '../../../components/organisms/PersonHeader';
import { RelationshipCard } from '../../../components/organisms/RelationshipCard';
import { RelatedPeople } from '../../../components/people/RelatedPeople';
import { SimilarByAttribute } from '../../../components/people/SimilarByAttribute';
import { getSimilarPeople } from '../../../lib/api/people';
import { ProfileLayout } from '../../../components/templates';
import { getPerson } from '../../../lib/api/people';
import { getRelationships } from '../../../lib/api/relationships';
import { buildPersonMetadata } from '../../../lib/seo/metadata';
import { buildArticleSchema, buildBreadcrumbSchema, buildEditorialAuthorSchema, buildFaqSchema, buildPersonSchema } from '../../../lib/seo/schema';
import { formatCurrencyShort, formatDate, formatHeight } from '../../../lib/utils/format';
import { getReleasedTiers } from '../../../lib/utils/release';
import type { RelationshipEdge, RelationshipNode } from '../../../lib/api/types';

const MarkdownContent = dynamic(() => import('../../../components/molecules/MarkdownContent'));
const RelationshipGraph = dynamic(() => import('../../../components/organisms/RelationshipGraph'));

interface DataSourceEntry {
  source?: string;
  url?: string;
  date?: string;
  updated?: string;
  updated_at?: string;
}

function pickDataSource(person: { data_sources?: Record<string, unknown> }, keys: string[]): DataSourceEntry | undefined {
  const sources = person.data_sources;
  if (!sources) return undefined;
  for (const key of keys) {
    const value = sources[key];
    if (value && typeof value === 'object') return value as DataSourceEntry;
  }
  return undefined;
}

function getAllSources(person: { data_sources?: Record<string, unknown> }): Array<{ field: string; source?: string; url?: string; updated?: string }> {
  const entries = person.data_sources ? Object.entries(person.data_sources) : [];
  const sources: Array<{ field: string; source?: string; url?: string; updated?: string }> = [];

  for (const [field, value] of entries) {
    if (!value || typeof value !== 'object') continue;
    const entry = value as DataSourceEntry;

    const source = typeof entry.source === 'string' ? entry.source : undefined;
    const url = typeof entry.url === 'string' ? entry.url : undefined;
    const updated = (typeof entry.updated_at === 'string' ? entry.updated_at : undefined)
      || (typeof entry.updated === 'string' ? entry.updated : undefined)
      || (typeof entry.date === 'string' ? entry.date : undefined);

    if (!source && !url) continue;
    sources.push({ field, source, url, updated });
  }

  return sources;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const person = await getPerson(params.slug).catch(() => null);
  if (!person) return {};
  const released = getReleasedTiers();
  const robots = released.includes(person.fame_tier || 'S') ? 'index, follow' : 'noindex, nofollow';
  return {
    ...buildPersonMetadata(person),
    robots,
  };
}

export default async function PersonPage({ params }: { params: { slug: string } }) {
  const person = await getPerson(params.slug).catch(() => null);
  if (!person) return notFound();
  const relationships = await getRelationships(params.slug).catch(() => ({ nodes: [], edges: [] }));
  const similarPeople = await getSimilarPeople(params.slug, 8).catch(() => []);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  const personSchema = buildPersonSchema(person, siteUrl);
  const articleSchema = buildArticleSchema(person, siteUrl);
  const authorSchema = buildEditorialAuthorSchema(siteUrl);
  const faqSchema = buildFaqSchema(person);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'People', href: '/people' },
    { label: person.full_name, href: `/people/${person.slug}` },
  ], siteUrl);

  const netWorthSource = pickDataSource(person, ['net_worth']);
  const heightSource = pickDataSource(person, ['height_cm', 'height']);
  const birthDateSource = pickDataSource(person, ['birth_date']);
  const allSources = getAllSources(person);

  return (
    <ProfileLayout>
      <Breadcrumb items={[
        { label: 'Home', href: '/' },
        { label: 'People', href: '/people' },
        { label: person.full_name },
      ]} />

      <PersonHeader
        name={person.full_name}
        imageUrl={person.image_url}
        occupation={person.occupation}
        country={person.country}
        socialLinks={person.social_links}
      />
      <p className="mt-3 text-sm text-text-secondary">
        By <Link href="/author/editorial-team" className="text-brand-700 hover:underline">FamousPeople.id Editorial Team</Link>
      </p>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid gap-3 md:grid-cols-3">
            <FactWithCitation
              label="Net Worth"
              value={formatCurrencyShort(person.net_worth)}
              sourceUrl={typeof netWorthSource?.url === 'string' ? netWorthSource.url : undefined}
              sourceName={typeof netWorthSource?.source === 'string' ? netWorthSource.source : 'CelebrityNetWorth'}
              lastUpdated={netWorthSource?.date || netWorthSource?.updated || netWorthSource?.updated_at}
            />
            <FactWithCitation
              label="Height"
              value={formatHeight(person.height_cm)}
              sourceUrl={typeof heightSource?.url === 'string' ? heightSource.url : undefined}
              sourceName={typeof heightSource?.source === 'string' ? heightSource.source : 'CelebHeights'}
            />
            <FactWithCitation
              label="Born"
              value={formatDate(person.birth_date)}
              sourceUrl={typeof birthDateSource?.url === 'string' ? birthDateSource.url : undefined}
              sourceName={typeof birthDateSource?.source === 'string' ? birthDateSource.source : 'Wikipedia'}
            />
            <FactWithCitation
              label="Zodiac"
              value={person.zodiac || '—'}
            />
            <FactWithCitation
              label="MBTI"
              value={person.mbti || '—'}
            />
            <FactWithCitation
              label="Country"
              value={person.country?.join(', ') || '—'}
            />
          </div>

          <section className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
            <h2 className="text-lg font-semibold text-text-primary">Biography</h2>
            <div className="prose mt-4 max-w-none text-sm text-text-secondary">
              <MarkdownContent content={person.content_md || person.bio_summary || ''} />
            </div>
            {(person.updated_at || person.created_at) && (
              <p className="mt-4 text-xs text-text-tertiary">
                Last updated: {formatDate(person.updated_at || person.created_at)}
              </p>
            )}
            {allSources.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-text-primary">Sources</h3>
                <ul className="mt-3 space-y-2 text-xs text-text-secondary">
                  {allSources.slice(0, 8).map((s) => (
                    <li key={s.field} className="flex flex-wrap gap-x-2 gap-y-1">
                      <span className="font-medium text-text-primary">{s.field}:</span>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="nofollow noreferrer noopener"
                          className="text-brand-700 hover:underline"
                        >
                          {s.source || 'Source'}
                        </a>
                      ) : (
                        <span>{s.source}</span>
                      )}
                      {s.updated && <span className="text-text-tertiary">· Updated {s.updated}</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-xs text-text-tertiary">
                  Report a correction: <a className="hover:underline" href="mailto:hello@famouspeople.id">hello@famouspeople.id</a>
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <RelationshipGraph nodes={relationships.nodes} edges={relationships.edges} />
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
            <h3 className="text-sm font-semibold text-text-primary">Key Relationships</h3>
            <div className="mt-4 space-y-2">
              {relationships.edges.slice(0, 6).map((edge: RelationshipEdge) => {
                const target = relationships.nodes.find((n: RelationshipNode) => n.fpid === edge.target_fpid || n.fpid === edge.source_fpid);
                if (!target || target.slug === person.slug) return null;
                return (
                  <RelationshipCard
                    key={`${edge.source_fpid}-${edge.target_fpid}`}
                    name={target.full_name}
                    slug={target.slug}
                    relation={edge.label || edge.relation_type}
                  />
                );
              })}
            </div>
          </div>
        </aside>
      </div>

      <div className="space-y-8">
        {similarPeople.length > 0 && (
          <RelatedPeople people={similarPeople} currentSlug={person.slug} />
        )}

        {person.zodiac && (
          <SimilarByAttribute
            type="zodiac"
            value={person.zodiac}
            currentSlug={person.slug}
          />
        )}

        {person.mbti && (
          <SimilarByAttribute
            type="mbti"
            value={person.mbti}
            currentSlug={person.slug}
          />
        )}

        {person.occupation?.[0] && (
          <SimilarByAttribute
            type="occupation"
            value={person.occupation[0]}
            currentSlug={person.slug}
          />
        )}
      </div>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(authorSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
    </ProfileLayout>
  );
}
