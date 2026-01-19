# FamousPeople.id Backend API - Technical Specification

> Version: 1.0.0 | Last Updated: 2026-01-18

## Table of Contents

1. [API Design Principles](#1-api-design-principles)
2. [Endpoint Specifications](#2-endpoint-specifications)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Rate Limiting Strategy](#4-rate-limiting-strategy)
5. [Caching Architecture](#5-caching-architecture)
6. [Database Query Patterns](#6-database-query-patterns)
7. [Error Handling & Logging](#7-error-handling--logging)
8. [Module Structure](#8-module-structure)
9. [Testing Strategy](#9-testing-strategy)
10. [OpenAPI Spec](#10-openapi-spec)

---

## ⚠️ Edge Runtime Compatibility (CRITICAL)

Next.js on Cloudflare Pages runs in **Edge Runtime**, NOT Node.js. Many npm packages will fail.

### Known Incompatible Packages

| Package | Issue | Solution |
|---------|-------|----------|
| `pg` (node-postgres) | Uses `net`, `tls` | Use `@supabase/supabase-js` with `fetch` |
| `bcrypt` | Native bindings | Use `bcryptjs` or edge-compatible alternative |
| `sharp` | Native bindings | Use Cloudflare Image Resizing |
| `fs`, `path` | Node.js APIs | Not available in Edge |
| Heavy ORMs (Prisma, TypeORM) | Often break | Use Supabase client or raw SQL |

### Supabase Edge-Compatible Setup

```typescript
// lib/supabase.ts - Edge-compatible client
import { createClient } from '@supabase/supabase-js';

// IMPORTANT: Use fetch transport (default in v2+)
export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    auth: { persistSession: false },
    global: { fetch }  // Explicit fetch for Edge
  }
);
```

### Testing Edge Compatibility Locally

```bash
# ❌ WRONG - Uses Node.js runtime, won't catch Edge issues
npm run dev

# ✅ CORRECT - Simulates Cloudflare Edge
npx wrangler pages dev .next --compatibility-date 2024-01-01

# Or use next.config.js edge runtime flag
# export const runtime = 'edge';
```

### When You Hit Edge Limits

If a feature absolutely requires Node.js:

1. **Move to VPS API** - Heavy computation goes to Docker backend
2. **Call via fetch** - Edge function calls VPS API through Tunnel
3. **Example:** PDF generation, complex image manipulation, ML inference

---

## 1. API Design Principles

### REST Conventions

| Method | Action | Success Code |
|--------|--------|--------------|
| GET | Retrieve resource(s) | 200 |
| POST | Create resource | 201 |
| PUT | Replace resource | 200 |
| PATCH | Partial update | 200 |
| DELETE | Remove resource | 204 |

### URL Structure

```
https://api.famouspeople.id/api/v1/{resource}
```

- **Versioning**: URL path (`/api/v1/`)
- **Resources**: Plural nouns (`/people`, `/rankings`)
- **Relationships**: Nested under parent (`/people/:slug/relationships`)

### Response Envelope

```typescript
// Success response
interface SuccessResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
    has_next?: boolean;
  };
}

// Error response
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable: "PERSON_NOT_FOUND"
    message: string;        // Human-readable: "Person with slug 'xyz' not found"
    details?: unknown;      // Validation errors, debug info
    request_id: string;     // Trace ID for debugging
  };
}
```

### Headers

Request:
```
Accept: application/json
Content-Type: application/json
Authorization: Bearer <token>  // Internal API only
X-Request-ID: <uuid>           // Optional, echoed in response
```

Response:
```
Content-Type: application/json
X-Request-ID: <uuid>
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705600000
Cache-Control: public, max-age=300
```

---

## 2. Endpoint Specifications

### 2.1 Public API

#### GET /api/v1/people/:slug

Retrieve a single person profile.

**Request**
```
GET /api/v1/people/elon-musk
```

**Response 200**
```json
{
  "data": {
    "fpid": "FP-1971-elon-musk",
    "slug": "elon-musk",
    "full_name": "Elon Musk",
    "type": "Person",
    "net_worth": 250000000000,
    "height_cm": 188,
    "birth_date": "1971-06-28",
    "death_date": null,
    "country": ["South Africa", "United States"],
    "mbti": "INTJ",
    "zodiac": "Cancer",
    "gender": "male",
    "occupation": ["Entrepreneur", "Engineer", "Investor"],
    "image_url": "https://cdn.famouspeople.id/images/elon-musk.webp",
    "wikipedia_url": "https://en.wikipedia.org/wiki/Elon_Musk",
    "social_links": {
      "twitter": "elonmusk",
      "instagram": null
    },
    "bio_summary": "CEO of Tesla and SpaceX...",
    "age": 54,
    "relationship_count": 12
  }
}
```

**Response 404**
```json
{
  "error": {
    "code": "PERSON_NOT_FOUND",
    "message": "Person with slug 'unknown-person' not found",
    "request_id": "req_abc123"
  }
}
```

---

#### GET /api/v1/people/:slug/relationships

Retrieve relationship graph edges for a person.

**Request**
```
GET /api/v1/people/elon-musk/relationships?type=spouse,ex_spouse&limit=20
```

**Query Parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string | all | Comma-separated relation types |
| direction | string | both | `outgoing`, `incoming`, `both` |
| limit | int | 50 | Max 100 |
| offset | int | 0 | Pagination offset |

**Response 200**
```json
{
  "data": {
    "nodes": [
      {"fpid": "FP-1971-elon-musk", "slug": "elon-musk", "full_name": "Elon Musk"},
      {"fpid": "FP-1988-grimes", "slug": "grimes", "full_name": "Grimes"}
    ],
    "edges": [
      {
        "source_fpid": "FP-1971-elon-musk",
        "target_fpid": "FP-1988-grimes",
        "relation_type": "ex_spouse",
        "label": "Ex-Spouse",
        "start_date": "2018-05-01",
        "end_date": "2022-03-01"
      }
    ]
  },
  "meta": {
    "total": 12,
    "limit": 20,
    "offset": 0
  }
}
```

---

#### GET /api/v1/search

Full-text search with faceted filtering.

**Request**
```
GET /api/v1/search?q=tech+billionaire&country=United+States&zodiac=Cancer&sort=net_worth:desc&limit=20
```

**Query Parameters**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| q | string | required | Search query (trigram match) |
| type | string | Person | Person, Organization, Band, Group |
| country | string | - | Filter by country |
| occupation | string | - | Filter by occupation |
| zodiac | string | - | Zodiac sign filter |
| mbti | string | - | MBTI type filter |
| gender | string | - | Gender filter |
| birth_year_min | int | - | Born after year |
| birth_year_max | int | - | Born before year |
| net_worth_min | bigint | - | Minimum net worth |
| is_alive | bool | - | Living/deceased filter |
| sort | string | relevance | `relevance`, `net_worth:desc`, `birth_date:asc`, `name:asc` |
| limit | int | 20 | Max 100 |
| offset | int | 0 | Pagination |

**Response 200**
```json
{
  "data": [
    {
      "fpid": "FP-1971-elon-musk",
      "slug": "elon-musk",
      "full_name": "Elon Musk",
      "net_worth": 250000000000,
      "occupation": ["Entrepreneur"],
      "image_url": "https://cdn.famouspeople.id/images/elon-musk.webp",
      "relevance_score": 0.95
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "per_page": 20,
    "has_next": true,
    "facets": {
      "country": [
        {"value": "United States", "count": 89},
        {"value": "China", "count": 34}
      ],
      "zodiac": [
        {"value": "Cancer", "count": 12},
        {"value": "Capricorn", "count": 11}
      ]
    }
  }
}
```

---

#### GET /api/v1/rankings/:category

Leaderboard by category.

**Categories**
| Category | Description | Sort |
|----------|-------------|------|
| net-worth | Richest people | net_worth DESC |
| height | Tallest people | height_cm DESC |
| zodiac/:sign | People by zodiac | birth_date ASC |
| country/:code | People by country | net_worth DESC |
| mbti/:type | People by MBTI | net_worth DESC |
| age | Oldest living | birth_date ASC |

**Request**
```
GET /api/v1/rankings/net-worth?limit=100
GET /api/v1/rankings/zodiac/cancer?limit=50
```

**Response 200**
```json
{
  "data": [
    {
      "rank": 1,
      "fpid": "FP-1971-elon-musk",
      "slug": "elon-musk",
      "full_name": "Elon Musk",
      "value": 250000000000,
      "formatted_value": "$250B"
    }
  ],
  "meta": {
    "category": "net-worth",
    "total": 5000,
    "limit": 100,
    "updated_at": "2026-01-18T00:00:00Z"
  }
}
```

---

#### GET /api/v1/compare

Side-by-side comparison of multiple people.

**Request**
```
GET /api/v1/compare?ids=elon-musk,jeff-bezos,bill-gates
```

**Query Parameters**
| Param | Type | Description |
|-------|------|-------------|
| ids | string | Comma-separated slugs (2-5 required) |
| fields | string | Optional: specific fields to compare |

**Response 200**
```json
{
  "data": {
    "people": [
      {
        "fpid": "FP-1971-elon-musk",
        "slug": "elon-musk",
        "full_name": "Elon Musk",
        "net_worth": 250000000000,
        "height_cm": 188,
        "birth_date": "1971-06-28",
        "age": 54,
        "zodiac": "Cancer",
        "mbti": "INTJ",
        "country": ["South Africa", "United States"],
        "occupation": ["Entrepreneur", "Engineer"]
      }
    ],
    "comparison": {
      "richest": "elon-musk",
      "tallest": "jeff-bezos",
      "oldest": "bill-gates",
      "net_worth_total": 450000000000
    }
  }
}
```

**Response 400**
```json
{
  "error": {
    "code": "INVALID_COMPARE_COUNT",
    "message": "Compare requires 2-5 people, got 1",
    "request_id": "req_xyz789"
  }
}
```

---

### 2.2 Internal API (Service Role)

#### POST /api/v1/sync/upsert

Bulk upsert identities from scraper.

**Request**
```json
{
  "identities": [
    {
      "fpid": "FP-1971-elon-musk",
      "slug": "elon-musk",
      "full_name": "Elon Musk",
      "type": "Person",
      "net_worth": 250000000000,
      "height_cm": 188,
      "birth_date": "1971-06-28",
      "country": ["South Africa", "United States"],
      "occupation": ["Entrepreneur", "Engineer", "Investor"],
      "is_published": true
    }
  ],
  "options": {
    "on_conflict": "update",
    "invalidate_cache": true
  }
}
```

**Response 200**
```json
{
  "data": {
    "inserted": 0,
    "updated": 1,
    "unchanged": 0,
    "errors": []
  }
}
```

---

#### POST /api/v1/sync/relationships

Sync relationship graph.

**Request**
```json
{
  "relationships": [
    {
      "source_fpid": "FP-1971-elon-musk",
      "target_fpid": "FP-1988-grimes",
      "relation_type": "ex_spouse",
      "start_date": "2018-05-01",
      "end_date": "2022-03-01"
    }
  ]
}
```

**Response 200**
```json
{
  "data": {
    "created": 1,
    "updated": 0,
    "skipped": 0
  }
}
```

---

#### POST /api/v1/embeddings/generate

Trigger OpenAI embedding generation for semantic search.

**Request**
```json
{
  "fpids": ["FP-1971-elon-musk"],
  "force": false
}
```

**Response 202**
```json
{
  "data": {
    "job_id": "emb_abc123",
    "queued": 1,
    "status": "processing"
  }
}
```

---

### 2.3 Edge Functions (Cloudflare Workers)

#### GET /api/og/:slug

Dynamic OG image generation.

**Response**: PNG image (1200x630)

**Implementation**
```typescript
// Served from Cloudflare Worker with @vercel/og
export default {
  async fetch(request: Request, env: Env) {
    const slug = new URL(request.url).pathname.split('/').pop();

    // Check KV cache first
    const cached = await env.OG_CACHE.get(`og:${slug}`, 'arrayBuffer');
    if (cached) {
      return new Response(cached, {
        headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=86400' }
      });
    }

    // Fetch person data, generate image, cache in KV
    // ...
  }
};
```

---

#### GET /api/sitemap/:page

Paginated sitemap XML (50,000 URLs per page).

**Response 200**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://famouspeople.id/person/elon-musk</loc>
    <lastmod>2026-01-18</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

#### POST /api/cache/purge

Cache invalidation webhook (called by sync endpoints).

**Request**
```json
{
  "keys": ["person:elon-musk", "ranking:net-worth"],
  "pattern": "search:*"
}
```

**Response 200**
```json
{
  "purged": 15
}
```

---

## 3. Authentication & Authorization

### Public API
- No authentication required
- Rate limited by IP
- RLS policy: `is_published = true`

### Internal API
- **Header**: `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>`
- **Validation**: Verify JWT signature with Supabase JWT secret
- RLS bypassed via service_role

```typescript
// middleware/auth.ts
import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';

export const serviceRoleAuth = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Missing token' } }, 401);
  }

  const token = authHeader.slice(7);
  try {
    const payload = await verify(token, c.env.SUPABASE_JWT_SECRET);
    if (payload.role !== 'service_role') {
      return c.json({ error: { code: 'FORBIDDEN', message: 'Service role required' } }, 403);
    }
    c.set('auth', payload);
    await next();
  } catch {
    return c.json({ error: { code: 'INVALID_TOKEN', message: 'Token verification failed' } }, 401);
  }
});
```

### Edge Functions
- Cloudflare Access or signed URLs for /cache/purge
- Public for /og and /sitemap

---

## 4. Rate Limiting Strategy

### Architecture
- **Storage**: Redis (Upstash) for distributed rate limiting
- **Algorithm**: Sliding window log

### Tiers

| Tier | Limit | Window | Applies To |
|------|-------|--------|------------|
| Anonymous | 60 req | 1 min | Public API by IP |
| Search | 30 req | 1 min | /search endpoint |
| Heavy | 10 req | 1 min | /compare, /rankings |
| Internal | 1000 req | 1 min | Service role |

### Implementation

```typescript
// middleware/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const rateLimiters = {
  default: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1m') }),
  search: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(30, '1m') }),
  heavy: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1m') }),
};

export const rateLimit = (tier: keyof typeof rateLimiters = 'default') => {
  return createMiddleware(async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const { success, limit, remaining, reset } = await rateLimiters[tier].limit(ip);

    c.header('X-RateLimit-Limit', limit.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', reset.toString());

    if (!success) {
      return c.json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
          retry_after: Math.ceil((reset - Date.now()) / 1000)
        }
      }, 429);
    }

    await next();
  });
};
```

---

## 5. Caching Architecture

### Layers

```
Request → Cloudflare CDN (edge) → Cloudflare KV (profile) → Redis (query) → Supabase
```

### Cloudflare KV Keys

| Pattern | TTL | Content |
|---------|-----|---------|
| `person:{slug}` | 5 min | Full profile JSON |
| `relationships:{slug}` | 5 min | Graph edges |
| `ranking:{category}` | 15 min | Top 100 leaderboard |
| `search:{hash}` | 2 min | Search results |
| `og:{slug}` | 24 hr | OG image binary |
| `sitemap:{page}` | 1 hr | Sitemap XML |

### Cache Key Generation

```typescript
function searchCacheKey(params: SearchParams): string {
  const normalized = {
    q: params.q?.toLowerCase().trim(),
    country: params.country,
    zodiac: params.zodiac,
    sort: params.sort || 'relevance',
    limit: params.limit || 20,
    offset: params.offset || 0,
  };
  const hash = createHash('sha256')
    .update(JSON.stringify(normalized))
    .digest('hex')
    .slice(0, 16);
  return `search:${hash}`;
}
```

### Invalidation Strategy

```typescript
// Called after sync/upsert
async function invalidateCache(slugs: string[], categories: string[]) {
  const keys = [
    ...slugs.map(s => `person:${s}`),
    ...slugs.map(s => `relationships:${s}`),
    ...categories.map(c => `ranking:${c}`),
  ];

  // Purge KV
  await Promise.all(keys.map(k => env.CACHE_KV.delete(k)));

  // Purge search cache (pattern match not supported in KV, use list)
  const searchKeys = await env.CACHE_KV.list({ prefix: 'search:' });
  await Promise.all(searchKeys.keys.map(k => env.CACHE_KV.delete(k.name)));
}
```

### Cache Headers

```typescript
// Public endpoints
c.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');

// Internal endpoints
c.header('Cache-Control', 'no-store');

// OG images
c.header('Cache-Control', 'public, max-age=86400, immutable');
```

---

## 6. Database Query Patterns

### Person by Slug (uses: `idx_identities_slug`)

```sql
SELECT
  fpid, slug, full_name, type, net_worth, height_cm,
  birth_date, death_date, country, mbti, zodiac, gender,
  occupation, image_url, wikipedia_url, social_links, bio_summary,
  EXTRACT(YEAR FROM AGE(COALESCE(death_date, CURRENT_DATE), birth_date))::int AS age
FROM identities
WHERE slug = $1 AND is_published = true;
```

### Relationships (uses: `idx_relationships_source`, `idx_relationships_target`)

```sql
WITH related AS (
  SELECT
    r.target_fpid AS fpid,
    r.relation_type,
    rt.label,
    r.start_date,
    r.end_date,
    'outgoing' AS direction
  FROM relationships r
  JOIN relation_types rt ON r.relation_type = rt.code
  WHERE r.source_fpid = $1

  UNION ALL

  SELECT
    r.source_fpid AS fpid,
    r.relation_type,
    rt.reverse_label AS label,
    r.start_date,
    r.end_date,
    'incoming' AS direction
  FROM relationships r
  JOIN relation_types rt ON r.relation_type = rt.code
  WHERE r.target_fpid = $1
)
SELECT
  r.*,
  i.slug,
  i.full_name,
  i.image_url
FROM related r
JOIN identities i ON r.fpid = i.fpid
WHERE i.is_published = true
LIMIT $2 OFFSET $3;
```

### Full-Text Search (uses: `idx_identities_full_name_trgm`)

```sql
SELECT
  fpid, slug, full_name, net_worth, occupation, image_url,
  similarity(full_name, $1) AS relevance_score
FROM identities
WHERE
  is_published = true
  AND full_name % $1  -- trigram similarity
  AND ($2::text IS NULL OR $2 = ANY(country))
  AND ($3::text IS NULL OR zodiac = $3)
  AND ($4::bigint IS NULL OR net_worth >= $4)
ORDER BY
  CASE WHEN $5 = 'relevance' THEN similarity(full_name, $1) END DESC,
  CASE WHEN $5 = 'net_worth:desc' THEN net_worth END DESC NULLS LAST,
  CASE WHEN $5 = 'birth_date:asc' THEN birth_date END ASC NULLS LAST
LIMIT $6 OFFSET $7;
```

### Rankings (uses: `idx_identities_net_worth`)

```sql
-- Net worth ranking
SELECT
  ROW_NUMBER() OVER (ORDER BY net_worth DESC NULLS LAST) AS rank,
  fpid, slug, full_name, net_worth AS value
FROM identities
WHERE is_published = true AND net_worth IS NOT NULL
ORDER BY net_worth DESC NULLS LAST
LIMIT $1;

-- Zodiac ranking
SELECT
  fpid, slug, full_name, net_worth
FROM identities
WHERE is_published = true AND zodiac = $1
ORDER BY net_worth DESC NULLS LAST
LIMIT $2;
```

### Vector Similarity Search (uses: `idx_identities_embedding`)

```sql
SELECT
  fpid, slug, full_name, bio_summary,
  1 - (embedding <=> $1::vector) AS similarity
FROM identities
WHERE is_published = true AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT $2;
```

---

## 7. Error Handling & Logging

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| PERSON_NOT_FOUND | 404 | Slug does not exist |
| INVALID_QUERY | 400 | Malformed query params |
| INVALID_COMPARE_COUNT | 400 | Compare needs 2-5 IDs |
| VALIDATION_ERROR | 400 | Request body validation failed |
| UNAUTHORIZED | 401 | Missing/invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| RATE_LIMITED | 429 | Exceeded rate limit |
| INTERNAL_ERROR | 500 | Unexpected server error |
| DATABASE_ERROR | 503 | Database connection failed |

### Structured Logging

```typescript
// lib/logger.ts
import { pino } from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    service: 'famouspeople-api',
    version: process.env.npm_package_version,
  },
});

// Usage in middleware
app.use('*', async (c, next) => {
  const requestId = c.req.header('X-Request-ID') || crypto.randomUUID();
  c.set('requestId', requestId);
  c.header('X-Request-ID', requestId);

  const start = Date.now();
  await next();

  logger.info({
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: Date.now() - start,
    ip: c.req.header('CF-Connecting-IP'),
    userAgent: c.req.header('User-Agent'),
  });
});
```

### Error Handler

```typescript
// middleware/errorHandler.ts
import { HTTPException } from 'hono/http-exception';

app.onError((err, c) => {
  const requestId = c.get('requestId') || 'unknown';

  if (err instanceof HTTPException) {
    return c.json({
      error: {
        code: err.message,
        message: err.cause?.toString() || 'Request failed',
        request_id: requestId,
      }
    }, err.status);
  }

  logger.error({ requestId, err: err.message, stack: err.stack });

  return c.json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      request_id: requestId,
    }
  }, 500);
});
```

---

## 8. Module Structure

```
famouspeople-api/
├── src/
│   ├── index.ts              # Hono app entry
│   ├── routes/
│   │   ├── people.ts         # GET /people/:slug, /people/:slug/relationships
│   │   ├── search.ts         # GET /search
│   │   ├── rankings.ts       # GET /rankings/:category
│   │   ├── compare.ts        # GET /compare
│   │   └── sync/
│   │       ├── upsert.ts     # POST /sync/upsert
│   │       ├── relationships.ts
│   │       └── embeddings.ts
│   ├── middleware/
│   │   ├── auth.ts           # Service role JWT validation
│   │   ├── rateLimit.ts      # Upstash rate limiter
│   │   ├── cache.ts          # KV cache middleware
│   │   ├── requestId.ts      # Request ID injection
│   │   └── errorHandler.ts   # Global error handler
│   ├── services/
│   │   ├── identities.ts     # Identity CRUD operations
│   │   ├── relationships.ts  # Relationship queries
│   │   ├── search.ts         # Search logic
│   │   └── embeddings.ts     # OpenAI embedding generation
│   ├── lib/
│   │   ├── db.ts             # Supabase client
│   │   ├── kv.ts             # Cloudflare KV client
│   │   ├── redis.ts          # Upstash Redis client
│   │   ├── logger.ts         # Pino logger
│   │   └── validators.ts     # Zod schemas
│   └── types/
│       ├── api.ts            # Request/response types
│       └── db.ts             # Database row types
├── workers/
│   ├── og-image/             # OG image generation worker
│   ├── sitemap/              # Sitemap generation worker
│   └── cache-purge/          # Cache invalidation worker
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── Dockerfile
├── docker-compose.yml
├── wrangler.toml             # Cloudflare Workers config
├── package.json
└── tsconfig.json
```

---

## 9. Testing Strategy

### Unit Tests (Vitest)

```typescript
// tests/unit/services/search.test.ts
import { describe, it, expect, vi } from 'vitest';
import { buildSearchQuery } from '@/services/search';

describe('buildSearchQuery', () => {
  it('builds trigram query with filters', () => {
    const query = buildSearchQuery({
      q: 'elon musk',
      country: 'United States',
      zodiac: 'Cancer',
      sort: 'net_worth:desc',
      limit: 20,
      offset: 0,
    });

    expect(query.sql).toContain('full_name %');
    expect(query.sql).toContain('ANY(country)');
    expect(query.params).toContain('elon musk');
  });
});
```

### Integration Tests

```typescript
// tests/integration/api/people.test.ts
import { describe, it, expect, beforeAll } from 'vitest';
import app from '@/index';

describe('GET /api/v1/people/:slug', () => {
  beforeAll(async () => {
    // Seed test data
  });

  it('returns person profile', async () => {
    const res = await app.request('/api/v1/people/elon-musk');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data.slug).toBe('elon-musk');
    expect(json.data.full_name).toBe('Elon Musk');
  });

  it('returns 404 for unknown slug', async () => {
    const res = await app.request('/api/v1/people/unknown-person');
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.error.code).toBe('PERSON_NOT_FOUND');
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/search.spec.ts
import { test, expect } from '@playwright/test';

test('search returns paginated results', async ({ request }) => {
  const response = await request.get('/api/v1/search?q=billionaire&limit=10');
  expect(response.ok()).toBeTruthy();

  const json = await response.json();
  expect(json.data.length).toBeLessThanOrEqual(10);
  expect(json.meta.total).toBeGreaterThan(0);
});
```

### Test Coverage Targets

| Layer | Coverage |
|-------|----------|
| Services | 90% |
| Routes | 85% |
| Middleware | 80% |
| Overall | 85% |

---

## 10. OpenAPI Spec

```yaml
openapi: 3.1.0
info:
  title: FamousPeople.id API
  version: 1.0.0
  description: Celebrity database API with relationship graphs and rankings
  contact:
    email: api@famouspeople.id

servers:
  - url: https://api.famouspeople.id/api/v1
    description: Production

paths:
  /people/{slug}:
    get:
      operationId: getPersonBySlug
      summary: Get person profile
      tags: [People]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
            example: elon-musk
      responses:
        '200':
          description: Person profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PersonResponse'
        '404':
          $ref: '#/components/responses/NotFound'

  /people/{slug}/relationships:
    get:
      operationId: getPersonRelationships
      summary: Get relationship graph
      tags: [People]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: type
          in: query
          schema:
            type: string
            description: Comma-separated relation types
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
            maximum: 100
      responses:
        '200':
          description: Relationship graph
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RelationshipsResponse'

  /search:
    get:
      operationId: searchPeople
      summary: Full-text search
      tags: [Search]
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
        - name: country
          in: query
          schema:
            type: string
        - name: zodiac
          in: query
          schema:
            type: string
            enum: [Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces]
        - name: sort
          in: query
          schema:
            type: string
            enum: [relevance, net_worth:desc, birth_date:asc, name:asc]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Search results with facets
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/SearchResponse'

  /rankings/{category}:
    get:
      operationId: getRankings
      summary: Leaderboard by category
      tags: [Rankings]
      parameters:
        - name: category
          in: path
          required: true
          schema:
            type: string
            enum: [net-worth, height, age]
        - name: limit
          in: query
          schema:
            type: integer
            default: 100
      responses:
        '200':
          description: Ranked list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RankingsResponse'

  /compare:
    get:
      operationId: comparePeople
      summary: Side-by-side comparison
      tags: [Compare]
      parameters:
        - name: ids
          in: query
          required: true
          schema:
            type: string
            description: Comma-separated slugs (2-5)
      responses:
        '200':
          description: Comparison data
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/CompareResponse'
        '400':
          $ref: '#/components/responses/BadRequest'

components:
  schemas:
    Person:
      type: object
      properties:
        fpid:
          type: string
          example: FP-1971-elon-musk
        slug:
          type: string
          example: elon-musk
        full_name:
          type: string
          example: Elon Musk
        type:
          type: string
          enum: [Person, Organization, Band, Group]
        net_worth:
          type: integer
          nullable: true
        height_cm:
          type: integer
          nullable: true
        birth_date:
          type: string
          format: date
          nullable: true
        death_date:
          type: string
          format: date
          nullable: true
        country:
          type: array
          items:
            type: string
        mbti:
          type: string
          pattern: '^[EI][NS][TF][JP]$'
          nullable: true
        zodiac:
          type: string
          enum: [Aries, Taurus, Gemini, Cancer, Leo, Virgo, Libra, Scorpio, Sagittarius, Capricorn, Aquarius, Pisces]
          nullable: true
        gender:
          type: string
          enum: [male, female, non-binary, other]
          nullable: true
        occupation:
          type: array
          items:
            type: string
        image_url:
          type: string
          format: uri
          nullable: true
        wikipedia_url:
          type: string
          format: uri
          nullable: true
        social_links:
          type: object
        bio_summary:
          type: string
          nullable: true
        age:
          type: integer
          nullable: true

    PersonResponse:
      type: object
      properties:
        data:
          $ref: '#/components/schemas/Person'

    RelationshipsResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            nodes:
              type: array
              items:
                type: object
                properties:
                  fpid:
                    type: string
                  slug:
                    type: string
                  full_name:
                    type: string
            edges:
              type: array
              items:
                type: object
                properties:
                  source_fpid:
                    type: string
                  target_fpid:
                    type: string
                  relation_type:
                    type: string
                  label:
                    type: string
                  start_date:
                    type: string
                    format: date
                    nullable: true
                  end_date:
                    type: string
                    format: date
                    nullable: true
        meta:
          $ref: '#/components/schemas/PaginationMeta'

    SearchResponse:
      type: object
      properties:
        data:
          type: array
          items:
            $ref: '#/components/schemas/Person'
        meta:
          allOf:
            - $ref: '#/components/schemas/PaginationMeta'
            - type: object
              properties:
                facets:
                  type: object

    RankingsResponse:
      type: object
      properties:
        data:
          type: array
          items:
            type: object
            properties:
              rank:
                type: integer
              fpid:
                type: string
              slug:
                type: string
              full_name:
                type: string
              value:
                type: integer
              formatted_value:
                type: string
        meta:
          type: object
          properties:
            category:
              type: string
            total:
              type: integer
            updated_at:
              type: string
              format: date-time

    CompareResponse:
      type: object
      properties:
        data:
          type: object
          properties:
            people:
              type: array
              items:
                $ref: '#/components/schemas/Person'
            comparison:
              type: object

    PaginationMeta:
      type: object
      properties:
        total:
          type: integer
        page:
          type: integer
        per_page:
          type: integer
        has_next:
          type: boolean

    Error:
      type: object
      required:
        - code
        - message
        - request_id
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: object
        request_id:
          type: string

  responses:
    BadRequest:
      description: Invalid request
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                $ref: '#/components/schemas/Error'
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                $ref: '#/components/schemas/Error'
    RateLimited:
      description: Rate limit exceeded
      headers:
        X-RateLimit-Limit:
          schema:
            type: integer
        X-RateLimit-Remaining:
          schema:
            type: integer
        X-RateLimit-Reset:
          schema:
            type: integer
      content:
        application/json:
          schema:
            type: object
            properties:
              error:
                $ref: '#/components/schemas/Error'

  securitySchemes:
    ServiceRole:
      type: http
      scheme: bearer
      bearerFormat: JWT

security: []

tags:
  - name: People
    description: Person profile operations
  - name: Search
    description: Full-text search
  - name: Rankings
    description: Leaderboard endpoints
  - name: Compare
    description: Comparison features
```

---

## Appendix: Environment Variables

```bash
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Redis (Upstash)
UPSTASH_REDIS_URL=https://xxx.upstash.io
UPSTASH_REDIS_TOKEN=xxx

# Cloudflare
CF_ACCOUNT_ID=xxx
CF_KV_NAMESPACE_ID=xxx
CF_API_TOKEN=xxx

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-xxx

# App
LOG_LEVEL=info
NODE_ENV=production
```
