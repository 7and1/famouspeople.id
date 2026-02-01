import { Metadata } from 'next';
import { ListingLayout } from '../../../components/templates';
import { getPerson } from '../../../lib/api/people';
import { getRelationships } from '../../../lib/api/relationships';
import { RelationshipCard } from '../../../components/organisms/RelationshipCard';
import { getReleasedTiers } from '../../../lib/utils/release';
import type { RelationshipEdge, RelationshipNode } from '../../../lib/api/types';

// Generate static params for top people only
export async function generateStaticParams() {
  return [{ slug: 'elon-musk' }];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPerson(slug).catch(() => null);
  if (!person) {
    return {
      title: 'Relationships | FamousPeople.id',
      description: 'Explore celebrity relationships and connections on FamousPeople.id.',
      alternates: { canonical: '/relationships' },
    };
  }
  const released = getReleasedTiers();
  const robots = released.includes(person.fame_tier || 'S') ? 'index, follow' : 'noindex, nofollow';
  const canonical = `/relationships/${person.slug}`;
  const title = `${person.full_name}'s Relationships | Family & Connections | FamousPeople.id`;
  const description = `Explore ${person.full_name}'s relationships, family connections, and celebrity network. Discover who they're related to and their famous connections on FamousPeople.id.`;
  return {
    title,
    description,
    robots,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      images: person.image_url ? [person.image_url] : [],
      url: canonical,
    },
  };
}

export default async function RelationshipsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = await getPerson(slug).catch(() => null);
  if (!person) {
    return (
      <ListingLayout>
        <div className="rounded-2xl border border-dashed border-surface-border p-8 text-center text-sm text-text-muted">
          Person not found.
        </div>
      </ListingLayout>
    );
  }

  const relationships = await getRelationships(slug).catch(() => ({ nodes: [], edges: [] }));

  return (
      <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{`${person.full_name}'s Relationships`}</h1>
        <p className="mt-2 text-sm text-text-secondary">Explore the relationship network for {person.full_name}.</p>
      </header>
      <div className="grid gap-3">
        {relationships.edges.map((edge: RelationshipEdge) => {
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
    </ListingLayout>
  );
}
