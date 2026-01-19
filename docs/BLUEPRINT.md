# FamousPeople.id - System Blueprint

## 1. Executive Summary

FamousPeople.id is a high-performance celebrity database serving 10,000+ profiles through a globally distributed edge architecture. The system combines Cloudflare Pages (SSR/Edge Runtime) for sub-100ms TTFB with a VPS-hosted backend API accessible via Cloudflare Tunnel, eliminating public IP exposure. Data flows from multi-source scraping (CelebrityNetWorth, CelebHeights, PersonalityDB, WhosDatedWho) through Proxy-Grid rotation, into Supabase PostgreSQL with pgvector for semantic search, cached aggressively at edge via Cloudflare KV and Cache API.

## 2. System Architecture

```
                                    CLOUDFLARE EDGE
    +------------------------------------------------------------------+
    |                                                                  |
    |   +------------------+      +------------------+                 |
    |   | Cloudflare Pages |      | Cloudflare KV    |                 |
    |   | (Next.js 14 SSR) |<---->| (Profile Cache)  |                 |
    |   +--------+---------+      +------------------+                 |
    |            |                                                     |
    |            v                                                     |
    |   +------------------+      +------------------+                 |
    |   | Edge Functions   |      | R2 + Workers     |                 |
    |   | (API Routes)     |<---->| (Images/OG)      |                 |
    |   +--------+---------+      +------------------+                 |
    |            |                                                     |
    +------------|-----------------------------------------------------+
                 | Cloudflare Tunnel (Zero-Trust)
                 v
    +------------------------------------------------------------------+
    |                        VPS (107.174.42.198)                      |
    |                                                                  |
    |   +------------------+      +------------------+                 |
    |   | Backend API      |      | Proxy-Grid       |                 |
    |   | (Docker:8006)    |      | (Scraping)       |                 |
    |   +--------+---------+      +--------+---------+                 |
    |            |                         |                           |
    |            v                         v                           |
    |   +--------------------------------------------------+           |
    |   |              supabase_default network            |           |
    |   |                                                  |           |
    |   |   +----------------+    +------------------+     |           |
    |   |   | supabase-db    |    | OpenAI API       |     |           |
    |   |   | (PostgreSQL)   |    | (Embeddings)     |     |           |
    |   |   | + pgvector     |    +------------------+     |           |
    |   |   +----------------+                             |           |
    |   +--------------------------------------------------+           |
    |                                                                  |
    |   +------------------+  (Internal only, not exposed)             |
    |   | Admin Dashboard  |  Supabase Studio or React-Admin           |
    |   | (Data Correction)|  http://localhost:3000                    |
    |   +------------------+                                           |
    +------------------------------------------------------------------+
```

### ⚠️ CRITICAL: Database Connection Pooling

**Problem:** Edge Runtime (Cloudflare Workers) spawns ephemeral instances. Direct Postgres connections will exhaust pool.

**Solution:** Always use **Supavisor** (Supabase's connection pooler) via **Transaction Mode (Port 6543)**.

```bash
# ❌ WRONG - Direct connection (Session Mode)
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# ✅ CORRECT - Pooled connection (Transaction Mode)
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:6543/postgres?pgbouncer=true
```

| Mode | Port | Use Case |
|------|------|----------|
| Session (Direct) | 5432 | Long-running scripts, migrations |
| Transaction (Pooled) | 6543 | Edge Functions, Serverless, API |

## 3. Data Flow

### 3.1 Scraping Pipeline (Batch)

```
+-------------+     +-------------+     +-------------+     +-------------+
| Wikidata    |     | Proxy-Grid  |     | Enrichment  |     | Supabase    |
| Base Export |---->| Multi-Source|---->| + Embedding |---->| PostgreSQL  |
| (10K CSV)   |     | Scraping    |     | Generation  |     | + pgvector  |
+-------------+     +-------------+     +-------------+     +-------------+
      |                   |                   |                   |
      v                   v                   v                   v
  SPARQL Query      CelebrityNetWorth    OpenAI API          identities
  sitelinks > 5     CelebHeights         text-embedding-     relationships
  LIMIT 10000       PersonalityDB        3-large             relation_types
                    WhosDatedWho         1536 dimensions
```

### 3.2 Request Flow (Runtime)

```
User Request
     |
     v
+--------------------+
| Cloudflare Edge    |
| Check KV Cache     |-----> HIT: Return cached (< 10ms)
+--------------------+
     | MISS
     v
+--------------------+
| Edge Function      |
| Check Cache API    |-----> HIT: Return cached (< 20ms)
+--------------------+
     | MISS
     v
+--------------------+
| Cloudflare Tunnel  |
| to VPS Backend     |
+--------------------+
     |
     v
+--------------------+
| Backend API        |
| Query Supabase     |-----> PostgreSQL (pgvector for similar)
+--------------------+
     |
     v
+--------------------+
| Response           |
| + Cache Headers    |-----> Set KV + Cache API
+--------------------+
     |
     v
User Response (< 100ms target)
```

## 4. Component Overview

### 4.1 Frontend (Cloudflare Pages)

| Aspect | Implementation |
|--------|----------------|
| Framework | Next.js 14+ (App Router) |
| Runtime | Edge Runtime (not Node.js) |
| Rendering | SSR with ISR fallback |
| Styling | Tailwind CSS |
| SEO | Dynamic meta, JSON-LD structured data |
| Image Optimization | Cloudflare R2 + Workers (resize on-the-fly) |

**Key Routes:**
- `/[slug]` - Profile page (ISR, revalidate: 86400)
- `/search` - Full-text + vector search
- `/browse/[category]` - Occupation/country filters
- `/compare` - Side-by-side profiles
- `/api/*` - Edge API routes

### 4.2 Backend API (VPS Docker)

| Aspect | Implementation |
|--------|----------------|
| Runtime | Python 3.11 (FastAPI) or Node.js (Hono) |
| Port | 8006 (next available API port) |
| Network | supabase_default |
| Access | Cloudflare Tunnel only (no public exposure) |
| Auth | CF Access JWT + API key header |

**Endpoints:**
- `GET /v1/profiles/:slug` - Single profile
- `GET /v1/profiles` - List with pagination
- `POST /v1/search` - Full-text + vector search
- `GET /v1/relationships/:fpid` - Relationship graph
- `POST /v1/admin/sync` - Trigger re-sync (admin)
- `POST /v1/admin/embed` - Generate embeddings (admin)

### 4.3 Edge Functions

| Function | Purpose | TTL |
|----------|---------|-----|
| Profile Loader | Fetch + cache profile JSON | 24h |
| Search Handler | Full-text search with caching | 1h |
| Similar Profiles | pgvector cosine similarity | 24h |
| Sitemap Generator | Dynamic XML sitemap | 6h |
| OG Image | Dynamic social cards | 7d |

### 4.4 Database (Supabase PostgreSQL)

**Schema:** `famouspeople` (isolated schema)

```sql
identities (
  fpid TEXT PRIMARY KEY,        -- "FP-1965-elon-musk"
  slug TEXT UNIQUE NOT NULL,    -- "elon-musk"
  full_name TEXT NOT NULL,
  type TEXT DEFAULT 'Person',   -- Person|Organization|Band|Group
  net_worth BIGINT,             -- USD cents for precision
  height_cm INT,
  birth_date DATE,
  death_date DATE,
  country TEXT[],               -- ["United States", "South Africa"]
  mbti TEXT,                    -- INTJ
  zodiac TEXT,                  -- Cancer
  gender TEXT,                  -- male|female|non-binary|other
  occupation TEXT[],            -- ["entrepreneur", "engineer"]
  image_url TEXT,
  wikipedia_url TEXT,
  social_links JSONB,           -- {instagram, x, tiktok, youtube}
  meta JSONB,                   -- {sources, last_scraped, confidence}
  bio_summary TEXT,             -- 2-3 sentence summary
  content_md TEXT,              -- Full markdown content
  embedding VECTOR(1536),       -- OpenAI text-embedding-3-large
  is_published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)

relationships (
  id BIGINT PRIMARY KEY,
  source_fpid TEXT REFERENCES identities(fpid),
  target_fpid TEXT REFERENCES identities(fpid),
  relation_type TEXT REFERENCES relation_types(code),
  start_date DATE,
  end_date DATE,
  details JSONB                 -- {notes, source_url}
)

relation_types (
  code TEXT PRIMARY KEY,        -- spouse, dated, parent, child, sibling
  label TEXT,                   -- "Spouse"
  reverse_label TEXT            -- "Spouse" (bidirectional)
)
```

**Indexes:**
- `idx_identities_slug` - B-tree on slug (primary lookup)
- `idx_identities_full_name_trgm` - GIN trigram (fuzzy search)
- `idx_identities_embedding` - HNSW vector (semantic search)
- `idx_identities_net_worth` - Descending (richest lists)
- `idx_identities_country` - GIN array (country filters)
- `idx_identities_occupation` - GIN array (profession filters)
- `idx_relationships_source/target` - FK lookups

## 5. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Edge CDN | Cloudflare | - | Global distribution, DDoS |
| Frontend | Next.js | 14.x | SSR, App Router |
| Edge Runtime | Cloudflare Workers | - | API routes, middleware |
| Cache L1 | Cloudflare KV | - | Profile JSON cache |
| Cache L2 | Cloudflare Cache API | - | HTML/response cache |
| Tunnel | cloudflared | latest | Zero-trust VPS access |
| Container | Docker | 24.x | Backend isolation |
| Backend | FastAPI / Hono | 0.x | REST API |
| Database | PostgreSQL | 15.x | Primary data store |
| Vector DB | pgvector | 0.6.x | Semantic search |
| Embeddings | OpenAI | - | text-embedding-3-large |
| Scraping | Proxy-Grid | custom | Residential rotation |
| Orchestration | Docker Compose | 2.x | Container management |

## 6. Security Model

### 6.1 Row-Level Security (RLS)

```sql
-- Public: Only published profiles
CREATE POLICY "public_read_published" ON identities
  FOR SELECT USING (is_published = true);

-- Authenticated: Read all (preview)
CREATE POLICY "auth_read_all" ON identities
  FOR SELECT TO authenticated USING (true);

-- Service Role: Full CRUD
CREATE POLICY "service_full" ON identities
  FOR ALL TO service_role USING (true);
```

### 6.2 API Security

| Layer | Mechanism |
|-------|-----------|
| Edge | Cloudflare WAF rules |
| Transport | TLS 1.3 (Cloudflare managed) |
| Tunnel Auth | Cloudflare Access (JWT) |
| API Auth | `X-API-Key` header (hashed in KV) |
| Rate Limiting | Cloudflare Rate Limiting (100 req/min/IP) |
| Admin | Cloudflare Access + OTP |

### 6.3 Secret Management

| Secret | Storage |
|--------|---------|
| SUPABASE_URL | Cloudflare Pages env var |
| SUPABASE_SERVICE_KEY | Cloudflare Pages env var (encrypted) |
| OPENAI_API_KEY | VPS Docker secret |
| API_KEYS | Cloudflare KV (hashed) |
| TUNNEL_TOKEN | VPS env (never committed) |

## 7. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| TTFB (cache hit) | < 50ms | Cloudflare Analytics |
| TTFB (cache miss) | < 100ms | Cloudflare Analytics |
| LCP | < 1.5s | Web Vitals |
| FID | < 100ms | Web Vitals |
| CLS | < 0.1 | Web Vitals |
| Lighthouse | > 90 | All categories |
| Search latency | < 200ms | P95 |
| Vector search | < 500ms | P95 (top 20 similar) |
| Cache hit rate | > 95% | KV Analytics |
| API uptime | 99.9% | Uptime Kuma |

### Caching Strategy

| Resource | TTL | Invalidation |
|----------|-----|--------------|
| Profile page HTML | 24h | On-demand purge |
| Profile JSON (KV) | 24h | sync_db.py trigger |
| Search results | 1h | TTL expiry |
| Similar profiles | 24h | TTL expiry |
| Static assets | 365d | Content hash |
| Sitemap | 6h | TTL expiry |
| OG images | 7d | TTL expiry |

## 8. Cost Projections

### 8.1 Cloudflare (Free Tier)

| Resource | Limit | Estimated Usage |
|----------|-------|-----------------|
| Pages requests | Unlimited | ~500K/month |
| Workers requests | 100K/day | ~50K/day |
| KV reads | 100K/day | ~80K/day |
| KV writes | 1K/day | ~500/day |
| KV storage | 1GB | ~100MB (10K profiles) |
| Bandwidth | Unlimited | ~50GB/month |

**Risk:** KV reads may exceed free tier at scale. Upgrade to Workers Paid ($5/mo) at 1M+ monthly pageviews.

### 8.2 Supabase (Free Tier)

| Resource | Limit | Estimated Usage |
|----------|-------|-----------------|
| Database | 500MB | ~200MB (10K profiles + embeddings) |
| API requests | 500K/month | ~100K/month (edge-cached) |
| Storage | 1GB | Not used (images on Cloudflare) |
| Bandwidth | 2GB | ~500MB/month |
| Vector dimensions | Unlimited | 10K x 1536 = ~60MB |

**Risk:** Embedding storage grows 6KB per profile. At 50K profiles, upgrade to Pro ($25/mo).

### 8.3 VPS (Existing)

| Resource | Current | Additional Load |
|----------|---------|-----------------|
| Port | 8006 | 1 new container |
| RAM | - | ~256MB for API |
| CPU | - | Minimal (cached responses) |
| Disk | - | ~50MB container |

### 8.4 External Services

| Service | Free Tier | Cost at Scale |
|---------|-----------|---------------|
| OpenAI Embeddings | - | ~$2 per 10K profiles (one-time) |
| Proxy-Grid | Internal | $0 (existing infrastructure) |

**Total Monthly Cost:** $0 (free tier) to $30/mo at scale.

## 9. Dependencies & External Services

### 9.1 Critical Dependencies

| Dependency | Failure Impact | Mitigation |
|------------|----------------|------------|
| Cloudflare | Site down | None (single point) |
| Supabase | Stale data | KV cache serves last-known |
| VPS | No fresh data | Edge cache continues serving |
| OpenAI | No new embeddings | Batch process, not real-time |

### 9.2 Data Sources

| Source | Data | Update Frequency |
|--------|------|------------------|
| Wikidata | Base profiles (10K) | One-time seed |
| CelebrityNetWorth | net_worth | Monthly |
| CelebHeights | height_cm | Quarterly |
| PersonalityDB | mbti | One-time |
| WhosDatedWho | relationships | Monthly |
| Wikipedia | bio_summary | Quarterly |

### 9.3 Internal Dependencies

| Service | Network | Purpose |
|---------|---------|---------|
| supabase-db | supabase_default | PostgreSQL 15 + pgvector |
| nginx-proxy | nginx-proxy_default | Reverse proxy (if needed) |
| Proxy-Grid | host network | Scraping rotation |

## 10. Critical Path & Risks

### 10.1 Implementation Phases

```
Phase 1: Foundation (Week 1-2)
├── Deploy database schema to Supabase
├── Seed 10K profiles from Wikidata
├── Set up Cloudflare Tunnel to VPS
└── Basic Next.js app on Cloudflare Pages

Phase 2: Core Features (Week 3-4)
├── Profile pages with SSR
├── Search (full-text + filters)
├── KV caching layer
└── Basic SEO (sitemap, meta)

Phase 3: Enrichment (Week 5-6)
├── Proxy-Grid scraping integration
├── OpenAI embedding generation
├── Similar profiles feature
└── Relationship graph

Phase 4: Polish (Week 7-8)
├── OG image generation
├── Performance optimization
├── Monitoring (Uptime Kuma)
└── Documentation
```

### 10.2 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cloudflare free tier exceeded | Medium | Site slowdown | Monitor KV reads, upgrade early |
| Scraping blocked | High | Stale enrichment | Proxy-Grid rotation, respectful rate |
| Supabase storage limit | Low | No new profiles | Purge unpublished, upgrade tier |
| Vector search latency | Medium | Slow similar feature | HNSW index, limit to top 20 |
| Edge Runtime limitations | Medium | Feature constraints | Move complex logic to VPS API |
| DB connection exhaustion | High | 500 errors | **Use Supavisor port 6543 (Transaction Mode)** |
| Google Sandbox (new domain) | High | No indexing | **Drip-feed 50-100 pages/day** |

### 10.3 Data Quality Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Duplicate profiles | Medium | SEO penalty | Dedup on Wikidata ID |
| Outdated net worth | High | User complaints | Source date display, monthly refresh |
| Missing relationships | High | Incomplete graph | Multiple sources, community edits (future) |
| Embedding drift | Low | Poor similarity | Re-embed on major content changes |

### 10.4 Success Metrics

| Metric | Month 1 | Month 6 | Month 12 |
|--------|---------|---------|----------|
| Profiles published | 5,000 | 10,000 | 25,000 |
| Monthly pageviews | 10,000 | 100,000 | 500,000 |
| Organic traffic | 1,000 | 30,000 | 150,000 |
| Average session | 1m | 2m | 3m |
| Pages per session | 1.5 | 2.5 | 4 |

---

## Appendix A: Docker Compose (VPS Backend)

```yaml
# /opt/docker-projects/heavy-tasks/famouspeople.id/docker-compose.yml
services:
  famouspeople-api:
    build: .
    container_name: famouspeople-api
    restart: unless-stopped
    ports:
      - "8006:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    networks:
      - supabase-tier
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

networks:
  supabase-tier:
    external: true
    name: supabase_default
```

## Appendix B: Cloudflare Tunnel Config

```yaml
# ~/.cloudflared/config.yml (VPS)
tunnel: famouspeople
credentials-file: /root/.cloudflared/famouspeople.json

ingress:
  - hostname: api.famouspeople.id
    service: http://localhost:8006
  - service: http_status:404
```

## Appendix C: Environment Variables

```bash
# Cloudflare Pages
NEXT_PUBLIC_API_URL=https://api.famouspeople.id
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# VPS Backend
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
PROXY_GRID_ENDPOINT=http://localhost:8003
```

---

**Document Version:** 1.0
**Last Updated:** 2026-01-18
**Author:** Architecture Agent
**Status:** Draft - Pending Review
