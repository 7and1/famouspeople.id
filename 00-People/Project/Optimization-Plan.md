---
title: FamousPeople.id Optimization Plan
date: 2026-01-31
tags: [project, pm, architecture, seo]
aliases: [Delivery Plan]
---

# Goals

- Production-grade web + API
- Correct technical SEO (robots, sitemap, canonical, index controls)
- Reliable deploy loop (repeatable, observable, safe)

# Scope (P0 → P2)

## P0 (Release blockers)
- Fix `/sitemap.xml` to include people URLs (no fallback-only sitemap)
- Fix RSS feeds (stop calling invalid `/search` endpoint without `q`)
- Add `web` ESLint config + deps so `npm run lint` runs non-interactively
- Person page metadata: control title length + add canonical URLs
- Add legal pages (privacy + terms) and link from footer + cookie banner

## P1 (High value)
- Noindex crawl traps (search results, compare detail pages)
- Ensure sitemap strategy supports scaling and tier-based drip indexing
- Normalize deployment docs/commands for `npm`

## P2 (Optimization)
- Default OpenGraph image route
- CI checks (api tests + web build/lint)

# Working Agreements

- Keep the current architecture (Cloudflare Pages → Tunnel → VPS API → Supabase).
- Prefer small, test-backed changes over large refactors.
- Always run tests/build at the end before shipping.

