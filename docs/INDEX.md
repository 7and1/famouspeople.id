# FamousPeople.id Documentation Index

> Production-ready celebrity database with 10K+ profiles

## Quick Start

1. Read [BLUEPRINT.md](./BLUEPRINT.md) for architecture overview
2. Follow [ROADMAP.md](./ROADMAP.md) for implementation phases
3. Use [../SOP.md](../SOP.md) for data pipeline operations

## Documentation Map

| Document | Purpose | Audience |
|----------|---------|----------|
| [BLUEPRINT.md](./BLUEPRINT.md) | System architecture, data flow, tech stack | All |
| [TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md) | API contracts, module design, caching | Backend Dev |
| [COMPONENT-SPEC.md](./COMPONENT-SPEC.md) | UI components, design system, a11y | Frontend Dev |
| [SEO-CONTENT-STRATEGY.md](./SEO-CONTENT-STRATEGY.md) | pSEO, schema.org, content templates | Content/SEO |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Infrastructure, CI/CD, monitoring | DevOps |
| [ROADMAP.md](./ROADMAP.md) | Development phases, task breakdown | PM/All |

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE EDGE                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ CF Pages    │  │ CF KV       │  │ CF Tunnel   │             │
│  │ (Next.js)   │  │ (Cache)     │  │ (Secure)    │             │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘             │
└─────────┼────────────────┼────────────────┼─────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    VPS 107.174.42.198                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Docker: famouspeople-api (Hono, Port 8006)             │   │
│  └─────────────────────────┬───────────────────────────────┘   │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  SUPABASE (PostgreSQL + pgvector)                               │
│  Tables: identities, relationships, relation_types              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frontend Runtime | Edge (Cloudflare) | TTFB < 100ms globally |
| Backend Framework | Hono | Lightweight, edge-compatible |
| Database | Supabase | Managed Postgres + RLS + pgvector |
| Cache Layer | Cloudflare KV | Global, millisecond reads |
| Tunnel | cloudflared | Zero-trust VPS exposure |

## Data Pipeline

```
Proxy-Grid (Scraping)
    ↓
people_sites.py (Normalize)
    ↓
sync_db.py (Upsert)
    ↓
Supabase (Store)
    ↓
API (Serve)
    ↓
Edge Cache (KV)
    ↓
Next.js SSR (Render)
```

## Port Allocation

| Service | Port | Network |
|---------|------|---------|
| famouspeople-api | 8006 | nginx-proxy_default |
| cloudflared tunnel | - | Outbound only |

## Next Steps

1. **Setup**: Copy `.env.example` → `.env`, configure Supabase
2. **Seed**: Run Wikidata query, execute `bulk_init.py`
3. **Develop**: Follow ROADMAP Phase 1 → 6
4. **Deploy**: Use DEPLOYMENT.md configs
