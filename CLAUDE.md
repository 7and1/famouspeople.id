# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FamousPeople.id is a celebrity database serving 10,000+ profiles through a distributed edge architecture. The system uses Cloudflare Pages for Next.js SSR frontend deployment, with a VPS-hosted Hono API backend accessible via Cloudflare Tunnel, using Supabase PostgreSQL as the primary database.

### Architecture

```
Cloudflare Pages (Next.js 16 SSR) → Cloudflare Tunnel → VPS API (Hono, port 8006) → Supabase PostgreSQL
```

**Key Points**:
- Frontend is Next.js 16 with SSR (Server-Side Rendering) deployed to Cloudflare Pages
- Dynamic routes use `force-dynamic` to enable on-demand rendering
- API runs on VPS (107.174.42.198:8006) and is exposed via Cloudflare Tunnel at https://api.famouspeople.id
- No Cloudflare Workers are used for the API (see `_archive/cloudflare-worker-unused/` for historical context)

## Directory Structure

| Directory | Purpose |
|-----------|---------|
| `api/` | Hono backend API (TypeScript/Node.js) running on VPS |
| `web/` | Next.js 16 frontend (App Router, SSR) |
| `scripts/` | Python data pipeline (Wikidata import, Supabase sync) |
| `supabase/` | Database schema and migrations |
| `docs/` | Architecture specs, roadmap, deployment guides |
| `00-People/` | Obsidian vault with markdown person profiles |
| `_archive/` | Archived/unused code (e.g., cloudflare-worker-unused) |

## Development Commands

### API (Backend)

```bash
cd api
npm install              # Install dependencies
npm run dev              # Development server with hot reload (tsx watch)
npm run build            # Compile TypeScript to dist/
npm run test             # Run Vitest tests
npm run test:watch       # Watch mode
npm start                # Run production build (dist/index.js)
```

### Web (Frontend)

```bash
cd web
npm install              # Install dependencies
npm run dev              # Next.js dev server (http://localhost:3000)
npm run build            # Production build with SSR
npm run lint             # ESLint check
```

**Note**: The frontend uses Next.js 16 with SSR. Dynamic routes use `export const dynamic = 'force-dynamic'` for on-demand rendering.

### Data Pipeline (Python)

```bash
# One-time setup
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Import/sync data
cd scripts
python bulk_init.py      # Generate markdown from CSV
python sync_db.py        # Sync markdown to Supabase
```

## Database Connection (CRITICAL)

This project uses Supabase with connection pooling. Use the correct connection mode:

| Mode | Port | Use Case |
|------|------|----------|
| Session (Direct) | 5432 | Long-running scripts, migrations |
| Transaction (Pooled) | 6543 | Edge Functions, Serverless, API |

Connection string format:
- Transaction Mode (port 6543): For API/Edge/Serverless with pgbouncer=true
- Session Mode (port 5432): For long-running scripts and migrations

## API Routes (Port 8006)

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | Health check |
| `/api/v1/people/:slug` | GET | Single person profile |
| `/api/v1/people/:slug/relationships` | GET | Relationship graph |
| `/api/v1/people/:slug/similar` | GET | Similar people by vector embedding (limit: 1-50) |
| `/api/v1/search` | GET | Full-text search with filters |
| `/api/v1/rankings/:category` | GET | Leaderboards (net-worth, height, etc.) |
| `/api/v1/compare` | GET | Side-by-side comparison |
| `/api/v1/categories/:type/:value` | GET | Category listings (zodiac, MBTI, occupation) |
| `/api/v1/latest` | GET | Latest updated profiles |
| `/api/v1/sync/upsert` | POST | Bulk upsert (service role) |
| `/api/v1/sitemap/:page` | GET | People sitemap XML (paged) |
| `/api/v1/sitemap-data/:page` | GET | People sitemap JSON (paged, used by web sitemap) |

## Environment Variables

### API (`api/.env`)

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Database Connection Pooling (CRITICAL)
# Use port 6543 for Transaction Mode (serverless/edge)
DATABASE_URL=<see .env.example>
DATABASE_SCHEMA=public

# API Configuration
PORT=8006
ALLOWED_ORIGINS=https://famouspeople.id,https://www.famouspeople.id
LOG_LEVEL=info
SITE_URL=https://famouspeople.id

# Optional: Rate limiting
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Optional: Vector embeddings for similarity search
OPENAI_API_KEY=
OPENAI_EMBEDDING_MODEL=text-embedding-3-large
```

### Web (`web/.env`)

```bash
NEXT_PUBLIC_API_URL=https://api.famouspeople.id/api/v1
NEXT_PUBLIC_SITE_URL=https://famouspeople.id
SUPABASE_URL=           # Optional: server-side queries
SUPABASE_ANON_KEY=      # Optional: server-side queries
```

## Deployment

### VPS (Backend API)

```bash
# SSH to production server
ssh root@107.174.42.198

# Navigate to project
cd /opt/docker-projects/heavy-tasks/famouspeople.id/api

# Build and restart
docker-compose down
docker-compose up -d --build

# View logs
docker logs -f famouspeople-api
```

### Cloudflare Pages (Frontend)

The frontend is automatically deployed via GitHub Actions (`.github/workflows/deploy.yml`) on push to main:

1. Builds Next.js with SSR: `npm run build` (outputs to `web/.next/`)
2. Deploys to Cloudflare Pages: `wrangler pages deploy web/.next --project-name=famouspeople`

**Manual deployment**:
```bash
cd web
npm run build
npx wrangler pages deploy .next --project-name=famouspeople
```

**Environment variables** are set in Cloudflare Pages dashboard:
- `NEXT_PUBLIC_API_URL=https://api.famouspeople.id/api/v1`
- `NEXT_PUBLIC_SITE_URL=https://famouspeople.id`

## Data Sync Workflow

1. **Import from Wikidata**: Run `scripts/bulk_init.py` to generate markdown files
2. **Manual Enrichment**: Edit files in `00-People/` with Obsidian
3. **Sync to Database**: Run `scripts/sync_db.py` to upsert to Supabase
4. **Cache Invalidation**: API purges relevant KV cache keys

## Database Schema (PostgreSQL + pgvector)

**Tables**:
- `identities` - Person profiles (fpid, slug, full_name, net_worth, height_cm, etc.)
- `relationships` - Relationship edges (source_fpid, target_fpid, relation_type)
- `relation_types` - Relationship type definitions

**Indexes**:
- `idx_identities_slug` - B-tree for slug lookup
- `idx_identities_full_name_trgm` - GIN trigram for fuzzy search
- `idx_identities_embedding` - HNSW for vector similarity
- `idx_identities_net_worth` - Descending for richest lists

Apply schema: `supabase/schema.sql` in Supabase SQL Editor.

## Frontend Components

### SEO Components
- `ItemListSchema` - Structured data for category pages
- `buildPersonSchema` - Person schema with full biographical data
- `buildFaqSchema` - Dynamic FAQ based on profile data
- `buildBreadcrumbSchema` - Breadcrumb navigation schema
- `buildCanonicalUrl` - Canonical URL generation with pagination
- `buildPaginationLinks` - prev/next links for SEO

### Display Components
- `RelatedPeople` - Shows similar profiles (vector embedding similarity)
- `SimilarByAttribute` - Displays people with shared attributes (zodiac, MBTI, occupation)
- `FactWithCitation` - Fact display with source attribution
- `PersonHeader` - Profile header with image and social links
- `RelationshipGraph` - Interactive relationship visualization
- `RelationshipCard` - Individual relationship display

### SEO Features
- Dynamic meta descriptions optimized for each page type
- robots.txt configuration with crawl delays for aggressive bots
- Canonical URLs for paginated content
- Open Graph tags for social sharing
- Fame tier-based robots meta tags (noindex for unreleased profiles)

## Coding Standards

1. **Relative imports only** - No `@/` path aliases (tsc doesn't resolve them)
2. **No sharp** - Use Next.js Image component or Cloudflare Image Resizing
3. **Env validation** - Use Zod for environment variable validation
4. **Health check** - API must have `/health` endpoint
5. **Graceful cache degradation** - Cache failures should never throw
6. **Dynamic routes** - Use `export const dynamic = 'force-dynamic'` for routes with searchParams
7. **Async params** - In Next.js 16, params are Promise objects and must be awaited

## Network Configuration

The API container joins two Docker networks:
- `nginx-proxy_default` (proxy-tier) - For nginx reverse proxy access
- `supabase_default` - For direct Supabase database access

## Testing

```bash
# API tests (218 tests)
cd api
npm run test           # Run all tests
npm run test:watch     # Watch mode
npm run test -- --coverage  # With coverage
```

**Test Coverage**:
- Integration: People routes (25), Search routes (41), Compare routes (22)
- Unit: Identities (24), Search (25), Relationships (16), Embeddings (27), Format (22), Compare (16)

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module '@/...'` | Path alias not resolved | Use relative imports |
| `ECONNREFUSED localhost` | Docker network issue | Use service name (`supabase-db`) |
| `SUPABASE_URL not set` | Missing .env | Copy `.env.example` to `.env` |
| `Connection pool exhausted` | Too many connections | Use port 6543 (pooler) |
| `KV reads exceeded` | Cloudflare free tier limit | Upgrade to Workers Paid |
| `similar endpoint returns 404` | No embeddings configured | Set OPENAI_API_KEY |
