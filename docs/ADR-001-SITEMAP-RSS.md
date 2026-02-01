---
title: "ADR-001: Sitemap Index + RSS Data Sources"
date: 2026-01-31
status: accepted
tags: [adr, seo, architecture]
---

# ADR-001: Sitemap Index + RSS Data Sources

## Context

- `web/app/sitemap.xml/route.ts` previously attempted to `res.json()` an API route that returns XML (`/api/v1/sitemap/:page`), causing a silent fallback sitemap that excluded people URLs.
- `web/app/rss.xml/route.ts` called `/api/v1/search?limit=50`, but the API requires a `q` parameter, producing an empty feed.
- We need sitemaps to be served on the main site domain (best practice for Search Console submissions) and to scale beyond 50k URLs if profiles grow.

## Decision

1. Add an API JSON endpoint for sitemap data:
   - `GET /api/v1/sitemap-data/:page` → `{ people, meta }`
2. Add an API endpoint for “latest updated profiles”:
   - `GET /api/v1/latest` → `{ data, meta }`
3. Make the web sitemap a sitemap index:
   - `GET /sitemap.xml` → sitemap index referencing:
     - `GET /sitemaps/static.xml`
     - `GET /sitemaps/people/{page}`
4. Fix RSS to use the new `/api/v1/latest` endpoint and emit RFC-822 `pubDate`.

## Consequences

- Sitemaps are now correct, people-inclusive, and host-consistent.
- RSS feeds are no longer empty due to invalid API usage.
- Growth path is clearer (paging via sitemap index) without changing the core architecture.

