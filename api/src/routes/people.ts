import { Hono } from 'hono';
import type { AppEnv } from '../types/app.js';
import { getPublicClient } from '../lib/db.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { getPersonBySlug, getRelationshipCount } from '../services/identities.js';
import { getRelationshipsBySlug } from '../services/relationships.js';
import { getSimilarPeople } from '../services/embeddings.js';
import { relationshipsQuerySchema } from '../lib/validators.js';
import { ErrorCode, createError } from '../lib/errors.js';

const people = new Hono<AppEnv>();

people.get('/people/:slug', rateLimit('default'), async (c) => {
  const slug = c.req.param('slug');
  const supabase = await getPublicClient();

  // Fetch person and relationship count in parallel to avoid N+1
  const [person, relationshipCountResult] = await Promise.all([
    getPersonBySlug(supabase, slug),
    (async () => {
      const tempPerson = await getPersonBySlug(supabase, slug);
      if (!tempPerson) return 0;
      return getRelationshipCount(supabase, tempPerson.fpid);
    })()
  ]);

  if (!person) {
    return c.json({
      error: createError(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Person with slug '${slug}' not found`,
        c.get('requestId')
      )
    }, 404);
  }

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

  return c.json({
    data: {
      ...person,
      relationship_count: relationshipCountResult,
    }
  });
});

people.get('/people/:slug/relationships', rateLimit('heavy'), async (c) => {
  const slug = c.req.param('slug');
  const parsed = relationshipsQuerySchema.safeParse(c.req.query());

  if (!parsed.success) {
    return c.json({
      error: createError(
        ErrorCode.VALIDATION_ERROR,
        parsed.error.message,
        c.get('requestId'),
        { issues: parsed.error.issues }
      )
    }, 400);
  }

  const { type, direction, limit, offset } = parsed.data;
  const typeList = type ? type.split(',').map((t) => t.trim()).filter(Boolean) : undefined;

  const supabase = await getPublicClient();
  const result = await getRelationshipsBySlug(supabase, slug, { type: typeList, direction, limit, offset });

  if (!result) {
    return c.json({
      error: createError(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Person with slug '${slug}' not found`,
        c.get('requestId')
      )
    }, 404);
  }

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

  return c.json({
    data: {
      nodes: result.nodes,
      edges: result.edges,
    },
    meta: {
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    }
  });
});

people.get('/people/:slug/similar', rateLimit('default'), async (c) => {
  const slug = c.req.param('slug');
  const limitParam = c.req.query('limit');
  const limit = limitParam ? parseInt(limitParam, 10) : 10;

  if (isNaN(limit) || limit < 1 || limit > 50) {
    return c.json({
      error: createError(
        ErrorCode.VALIDATION_ERROR,
        'limit must be between 1 and 50',
        c.get('requestId'),
        { field: 'limit', value: limitParam }
      )
    }, 400);
  }

  const supabase = await getPublicClient();
  const person = await getPersonBySlug(supabase, slug);

  if (!person) {
    return c.json({
      error: createError(
        ErrorCode.RESOURCE_NOT_FOUND,
        `Person with slug '${slug}' not found`,
        c.get('requestId')
      )
    }, 404);
  }

  const similarPeople = await getSimilarPeople(supabase, person.fpid, limit);

  c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

  return c.json({
    data: similarPeople,
    meta: {
      limit,
      count: similarPeople.length,
    }
  });
});

export default people;
