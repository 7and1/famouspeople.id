import type { SupabaseClient } from '@supabase/supabase-js';
import { getPersonBySlug } from './identities.js';

export interface RelationshipEdge {
  source_fpid: string;
  target_fpid: string;
  relation_type: string;
  label: string | null;
  start_date: string | null;
  end_date: string | null;
  direction: 'outgoing' | 'incoming';
}

export interface RelationshipNode {
  fpid: string;
  slug: string;
  full_name: string;
  image_url: string | null;
}

export const getRelationshipsBySlug = async (
  supabase: SupabaseClient,
  slug: string,
  options: {
    type?: string[];
    direction?: 'outgoing' | 'incoming' | 'both';
    limit?: number;
    offset?: number;
  }
) => {
  const person = await getPersonBySlug(supabase, slug);
  if (!person) return null;

  const { type, direction = 'both', limit = 50, offset = 0 } = options;

  let query = supabase
    .from('relationships')
    .select('source_fpid, target_fpid, relation_type, start_date, end_date');

  if (direction === 'outgoing') {
    query = query.eq('source_fpid', person.fpid);
  } else if (direction === 'incoming') {
    query = query.eq('target_fpid', person.fpid);
  } else {
    query = query.or(`source_fpid.eq.${person.fpid},target_fpid.eq.${person.fpid}`);
  }

  if (type?.length) {
    query = query.in('relation_type', type);
  }

  query = query.range(offset, offset + limit - 1);

  const [{ data: rels, error }, { data: relTypes }] = await Promise.all([
    query,
    supabase.from('relation_types').select('code, label, reverse_label'),
  ]);

  if (error || !rels) return null;

  const typeMap = new Map(
    (relTypes || []).map((row: any) => [row.code, row])
  );

  const edges: RelationshipEdge[] = rels.map((rel: any) => {
    const isOutgoing = rel.source_fpid === person.fpid;
    const meta = typeMap.get(rel.relation_type);
    return {
      source_fpid: rel.source_fpid,
      target_fpid: rel.target_fpid,
      relation_type: rel.relation_type,
      label: isOutgoing ? meta?.label ?? null : meta?.reverse_label ?? meta?.label ?? null,
      start_date: rel.start_date,
      end_date: rel.end_date,
      direction: isOutgoing ? 'outgoing' : 'incoming',
    };
  });

  const fpids = new Set<string>([person.fpid]);
  edges.forEach((edge) => {
    fpids.add(edge.source_fpid);
    fpids.add(edge.target_fpid);
  });

  const { data: nodesData } = await supabase
    .from('identities')
    .select('fpid, slug, full_name, image_url')
    .in('fpid', Array.from(fpids))
    .eq('is_published', true);

  const nodes: RelationshipNode[] = (nodesData || []).map((row: any) => ({
    fpid: row.fpid,
    slug: row.slug,
    full_name: row.full_name,
    image_url: row.image_url,
  }));

  const { count } = await supabase
    .from('relationships')
    .select('id', { count: 'exact', head: true })
    .or(`source_fpid.eq.${person.fpid},target_fpid.eq.${person.fpid}`);

  return {
    person,
    nodes,
    edges,
    total: count || edges.length,
    limit,
    offset,
  };
};
