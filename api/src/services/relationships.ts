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

  // Build base query with JOINs to eliminate N+1
  let query = supabase
    .from('relationships')
    .select(`
      source_fpid,
      target_fpid,
      relation_type,
      start_date,
      end_date,
      relation_types:relation_types!inner(code, label, reverse_label),
      source:identities!source_fpid(fpid, slug, full_name, image_url, is_published),
      target:identities!target_fpid(fpid, slug, full_name, image_url, is_published)
    `);

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

  const { data: rels, error } = await query;

  if (error || !rels) return null;

  const fpids = new Set<string>([person.fpid]);
  const edges: RelationshipEdge[] = [];
  const nodesMap = new Map<string, RelationshipNode>();

  for (const rel of rels as any[]) {
    const isOutgoing = rel.source_fpid === person.fpid;
    const relatedPerson = isOutgoing ? rel.target : rel.source;

    if (!relatedPerson?.is_published) continue;

    fpids.add(rel.source_fpid);
    fpids.add(rel.target_fpid);

    // Build nodes map from joined data
    if (rel.source && !nodesMap.has(rel.source.fpid)) {
      nodesMap.set(rel.source.fpid, {
        fpid: rel.source.fpid,
        slug: rel.source.slug,
        full_name: rel.source.full_name,
        image_url: rel.source.image_url,
      });
    }
    if (rel.target && !nodesMap.has(rel.target.fpid)) {
      nodesMap.set(rel.target.fpid, {
        fpid: rel.target.fpid,
        slug: rel.target.slug,
        full_name: rel.target.full_name,
        image_url: rel.target.image_url,
      });
    }

    const meta = rel.relation_types;
    edges.push({
      source_fpid: rel.source_fpid,
      target_fpid: rel.target_fpid,
      relation_type: rel.relation_type,
      label: isOutgoing ? meta?.label ?? null : meta?.reverse_label ?? meta?.label ?? null,
      start_date: rel.start_date,
      end_date: rel.end_date,
      direction: isOutgoing ? 'outgoing' : 'incoming',
    });
  }

  const nodes = Array.from(nodesMap.values());

  // Get total count efficiently
  const { count } = await supabase
    .from('relationships')
    .select('*', { count: 'exact', head: true })
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
