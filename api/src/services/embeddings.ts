import type { SupabaseClient } from '@supabase/supabase-js';

const OPENAI_ENDPOINT = 'https://api.openai.com/v1/embeddings';
const OPENAI_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-large';

export const generateEmbeddings = async (supabase: SupabaseClient, fpids: string[]) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  const { data, error } = await supabase
    .from('identities')
    .select('fpid, full_name, bio_summary, content_md')
    .in('fpid', fpids);

  if (error || !data) {
    throw new Error('Failed to load identities for embeddings');
  }

  const inputs = data.map((row) => {
    const parts = [row.full_name, row.bio_summary, row.content_md].filter(Boolean);
    return parts.join('\n');
  });

  const response = await fetch(OPENAI_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      input: inputs,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI error: ${errorText}`);
  }

  const payload = await response.json() as { data?: Array<{ embedding: number[] }> };
  const embeddings = payload.data || [];

  const updates = data.map((row, index) => ({
    fpid: row.fpid,
    embedding: embeddings[index]?.embedding || null,
  }));

  const { error: updateError } = await supabase
    .from('identities')
    .upsert(updates, { onConflict: 'fpid' });

  if (updateError) {
    throw new Error('Failed to store embeddings');
  }

  return {
    updated: updates.length,
    model: OPENAI_MODEL,
  };
};

export interface SimilarPerson {
  fpid: string;
  slug: string;
  full_name: string;
  image_url: string | null;
  bio_summary: string | null;
  similarity_score: number;
}

export const getSimilarPeople = async (
  supabase: SupabaseClient,
  fpid: string,
  limit = 10
): Promise<SimilarPerson[]> => {
  const normalizedLimit = Math.min(Math.max(1, limit), 50);

  const { data, error } = await supabase
    .from('identities')
    .select('fpid, slug, full_name, image_url, bio_summary, embedding')
    .eq('is_published', true)
    .not('embedding', 'is', null);

  if (error || !data) {
    throw new Error(`Failed to get similar people: ${error?.message || 'No data'}`);
  }

  const sourceRow = data.find((row: any) => row.fpid === fpid);
  if (!sourceRow || !sourceRow.embedding) {
    return [];
  }

  const sourceEmbedding = sourceRow.embedding as number[];

  const similarities = data
    .filter((row: any) => row.fpid !== fpid && row.embedding)
    .map((row: any) => {
      const targetEmbedding = row.embedding as number[];
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;

      for (let i = 0; i < sourceEmbedding.length; i++) {
        dotProduct += sourceEmbedding[i] * targetEmbedding[i];
        normA += sourceEmbedding[i] * sourceEmbedding[i];
        normB += targetEmbedding[i] * targetEmbedding[i];
      }

      const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

      return {
        fpid: row.fpid,
        slug: row.slug,
        full_name: row.full_name,
        image_url: row.image_url,
        bio_summary: row.bio_summary,
        similarity_score: similarity,
      };
    })
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, normalizedLimit);

  return similarities;
};
