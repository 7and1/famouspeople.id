import { ListingLayout } from '../../../components/templates';
import { getPerson } from '../../../lib/api/people';
import { getRelationships } from '../../../lib/api/relationships';
import { RelationshipCard } from '../../../components/organisms';

export default async function RelationshipsPage({ params }: { params: { slug: string } }) {
  const person = await getPerson(params.slug).catch(() => null);
  if (!person) {
    return (
      <ListingLayout>
        <div className="rounded-2xl border border-dashed border-surface-border p-8 text-center text-sm text-text-muted">
          Person not found.
        </div>
      </ListingLayout>
    );
  }

  const relationships = await getRelationships(params.slug).catch(() => ({ nodes: [], edges: [] }));

  return (
    <ListingLayout>
      <header className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
        <h1 className="text-2xl font-semibold text-text-primary">{person.full_name}'s Relationships</h1>
        <p className="mt-2 text-sm text-text-secondary">Explore the relationship network for {person.full_name}.</p>
      </header>
      <div className="grid gap-3">
        {relationships.edges.map((edge: any) => {
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
    </ListingLayout>
  );
}
