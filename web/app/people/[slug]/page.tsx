import { notFound } from 'next/navigation';
import { Breadcrumb, FactWithCitation, MarkdownContent } from '../../../components/molecules';
import { PersonHeader, RelationshipGraph, RelationshipCard } from '../../../components/organisms';
import { SimilarByAttribute } from '../../../components/people/SimilarByAttribute';
import { ProfileLayout } from '../../../components/templates';
import { getPerson } from '../../../lib/api/people';
import { getRelationships } from '../../../lib/api/relationships';
import { buildPersonMetadata } from '../../../lib/seo/metadata';
import { buildBreadcrumbSchema, buildFaqSchema, buildPersonSchema, buildWebsiteSchema } from '../../../lib/seo/schema';
import { formatCurrencyShort, formatDate, formatHeight } from '../../../lib/utils/format';
import { getReleasedTiers } from '../../../lib/utils/release';

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  const personSchema = buildPersonSchema(person, siteUrl);
  const faqSchema = buildFaqSchema(person);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: 'Home', href: '/' },
    { label: 'People', href: '/people' },
    { label: person.full_name, href: `/people/${person.slug}` },
  ], siteUrl);

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

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid gap-3 md:grid-cols-3">
            <FactWithCitation
              label="Net Worth"
              value={formatCurrencyShort(person.net_worth)}
              sourceUrl={person.sources?.net_worth_url}
              sourceName={person.sources?.net_worth_source || 'CelebrityNetWorth'}
              lastUpdated={person.sources?.net_worth_updated}
            />
            <FactWithCitation
              label="Height"
              value={formatHeight(person.height_cm)}
              sourceUrl={person.sources?.height_url}
              sourceName={person.sources?.height_source || 'CelebHeights'}
            />
            <FactWithCitation
              label="Born"
              value={formatDate(person.birth_date)}
              sourceUrl={person.sources?.birth_date_url}
              sourceName="Wikipedia"
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
          </section>
        </div>

        <aside className="space-y-6">
          <RelationshipGraph nodes={relationships.nodes} edges={relationships.edges} />
          <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
            <h3 className="text-sm font-semibold text-text-primary">Key Relationships</h3>
            <div className="mt-4 space-y-2">
              {relationships.edges.slice(0, 6).map((edge: any) => {
                const target = relationships.nodes.find((n: any) => n.fpid === edge.target_fpid || n.fpid === edge.source_fpid);
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildWebsiteSchema(siteUrl)) }} />
    </ProfileLayout>
  );
}
