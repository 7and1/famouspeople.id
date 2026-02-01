# Quality Gate (Production Readiness)

This document defines the minimum acceptance criteria for shipping FamousPeople.id as a production-grade system (frontend + backend + SEO).

## P0: Must Pass (Release Blockers)

### Backend (API)
- [ ] `GET /health` returns `200` when DB is reachable, otherwise `503` (degraded) with structured JSON error surface.
- [ ] All API tests pass: `cd api && npm test`.
- [ ] `npm run build` succeeds: `cd api && npm run build`.
- [ ] No secrets committed (confirm `.gitignore` covers `.env*` and credentials).
- [ ] Sync endpoints require `service_role` JWT and reject missing/invalid tokens.

### Frontend (Web)
- [ ] `cd web && npm run build` succeeds (typecheck + build).
- [ ] `cd web && npm run lint` runs non-interactively and passes.
- [ ] Critical routes render with SSR without runtime exceptions:
  - [ ] `/`
  - [ ] `/people/[slug]`
  - [ ] `/richest`, `/tallest`
  - [ ] `/zodiac/[sign]`, `/mbti/[type]`, `/occupation/[slug]`, `/country/[code]`, `/birthday/[month]`, `/birthday-today`
  - [ ] `/search` and query results
  - [ ] `/compare` and `/compare/[...slugs]`

### SEO (Technical)
- [ ] `GET /robots.txt` includes a valid `Sitemap:` line.
- [ ] `GET /sitemap.xml` returns valid XML and is not an empty fallback.
- [ ] Local validator passes: `node scripts/seo/validate.mjs --start-local`.
- [ ] Person pages include:
  - [ ] One H1
  - [ ] Canonical URL
  - [ ] Structured data (Person + Article + Author + FAQ + Breadcrumb + WebSite)
  - [ ] `robots` aligned with tier release logic (index for released tiers, noindex for unreleased)
- [ ] Search results pages are `noindex` to prevent crawl traps.

### Deployment (VPS)
- [ ] `api/docker-compose.yml` can rebuild and restart without data loss.
- [ ] Deploy workflow has a deterministic, observable path (health checks + logs on failure).

## P1: Should Pass (High Value)

- [ ] Static legal pages exist (privacy + terms) and are linked from footer and cookie banner.
- [ ] RSS endpoints return non-empty feeds when API is available.
- [ ] Sitemaps support scale growth (safe behavior if profiles exceed 50k URLs).

## P2: Nice to Have (Optimization)

- [ ] Sitemap index split (static + people, optional category sitemaps).
- [ ] Open Graph default image route and consistent metadata across templates.
- [ ] Performance budgets documented (CWV targets + caching rules).
