# FamousPeople.id

Production-ready celebrity database with API, frontend, and data pipeline. Serving 10,000+ celebrity profiles with comprehensive biographical data, relationships, and semantic search.

## Structure

- `api/` – Hono API (VPS container, port 8006)
- `web/` – Next.js 16 App Router (Cloudflare Pages)
- `scripts/` – Wikidata import + Supabase sync
- `supabase/` – Schema + RPC functions
- `docs/` – Architecture, specs, roadmap

## Features

### API
- RESTful endpoints for people, relationships, search, rankings, and comparisons
- Vector similarity search via `/api/v1/people/:slug/similar`
- Connection pooling with Supabase (port 6543 for Transaction Mode)
- Health check endpoint at `/health`
- Rate limiting middleware
- 195+ test cases (integration + unit)

### Frontend
- Server-side rendering with Next.js 16 App Router
- SEO-optimized with FAQ schema, ItemList schema, and structured data
- Dynamic meta descriptions and canonical URLs
- robots.txt configuration for crawler control
- Components: RelatedPeople, SimilarByAttribute, FactWithCitation

### SEO Tooling
- `node scripts/seo/validate.mjs --start-local` (robots/sitemap/rss + homepage quality gate)
- `node scripts/seo/competitor-audit.mjs` (competitor metrics snapshot)
- `node scripts/seo/keyword-opportunities.mjs` (top 20 keyword clusters; optional Keywords Everywhere API)

### Data Pipeline
- Wikidata bulk import
- Markdown-based profile management (Obsidian-compatible)
- Supabase synchronization with upsert operations

## Quick Start

```bash
# Data pipeline
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python scripts/bulk_init.py
python scripts/sync_db.py
```

```bash
# API
cd api
cp .env.example .env
npm install
npm run dev    # Development server
npm run test   # Run tests
npm run build  # Production build
```

```bash
# Web
cd web
cp .env.example .env
npm install
npm run dev    # Development server (http://localhost:3000)
npm run build  # Production build
```

## API Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/health` | GET | Health check |
| `/api/v1/people/:slug` | GET | Single person profile |
| `/api/v1/people/:slug/relationships` | GET | Relationship graph |
| `/api/v1/people/:slug/similar` | GET | Similar people by vector embedding |
| `/api/v1/search` | GET | Full-text search with filters |
| `/api/v1/rankings/:category` | GET | Leaderboards (net-worth, height, etc.) |
| `/api/v1/compare` | GET | Side-by-side comparison |
| `/api/v1/latest` | GET | Latest updated profiles |
| `/api/v1/sync/upsert` | POST | Bulk upsert (service role) |
| `/api/v1/sitemap/:page` | GET | People sitemap XML (paged) |
| `/api/v1/sitemap-data/:page` | GET | People sitemap JSON (paged, used by web sitemap) |

## Notes

- Apply `supabase/schema.sql` in Supabase SQL editor before syncing
- Cloudflare Pages build command: `npm run build` in `web/`
- API runs on port `8006` by default
- Use port `6543` for Supabase connection pooling (Transaction Mode)
- Docker image uses `node:20-slim` with health checks
