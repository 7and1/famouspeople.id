'use client';

interface RelationshipNode {
  fpid: string;
  full_name: string;
}

interface RelationshipEdge {
  source_fpid: string;
  target_fpid: string;
  relation_type: string;
  label?: string | null;
}

export function RelationshipGraph({ nodes, edges }: { nodes: RelationshipNode[]; edges: RelationshipEdge[] }) {
  return (
    <div className="rounded-2xl border border-surface-border bg-white p-6 shadow-card">
      <h3 className="text-sm font-semibold text-text-primary">Relationship Graph</h3>
      <p className="mt-2 text-xs text-text-muted">Interactive graph is loading in the full experience. Summary below.</p>
      <div className="mt-4 space-y-2 text-sm text-text-secondary">
        {edges.map((edge, index) => {
          const source = nodes.find((n) => n.fpid === edge.source_fpid)?.full_name || edge.source_fpid;
          const target = nodes.find((n) => n.fpid === edge.target_fpid)?.full_name || edge.target_fpid;
          return (
            <div key={`${edge.source_fpid}-${edge.target_fpid}-${index}`}>
              {source} → {edge.label || edge.relation_type} → {target}
            </div>
          );
        })}
      </div>
    </div>
  );
}
