---
title: P2 Optimization Plan
date: 2026-01-31
tags: [pm, architecture, seo, delivery]
---

# FamousPeople.id — P0/P1/P2 Optimization Plan

This plan keeps the existing architecture (Cloudflare Pages + VPS Hono API + Supabase) and focuses on production readiness + SEO correctness.

## Requirements
**One-liner**: Ship a production-grade celebrity database where SEO-critical endpoints and page templates are correct, fast, and indexable at scale.
**Target Users**: Search users, researchers/fans, and crawlers (Google/Bing).
**Core Problem**: Programmatic pages only work if the technical SEO surface (sitemaps, canonical, robots, index controls) is correct and the deployment loop is reliable.

## Scope

### P0 (Must Have)
- [x] Fix sitemap generation so `/sitemap.xml` is valid and includes people URLs (no silent fallback).
- [x] Fix RSS feeds so they fetch from a valid API endpoint (no empty feed due to invalid `/search` usage).
- [x] Make `web` lint non-interactive + consistent (ESLint config + `npm run lint`).
- [x] Tighten metadata templates (especially person pages): title length control, canonical URLs, robots correctness.
- [x] Add legal pages + link from UI (privacy/terms) to support trust and compliance signals.

### P1 (Should Have)
- [x] Add sitemap scalability strategy (sitemap index + paged people sitemaps) aligned with the release-tier rollout.
- [x] Ensure search/compare “crawl trap” pages are `noindex` (while keeping them usable for users).
- [x] Normalize docs and deployment commands for `npm`.
- [x] Add basic static assets used by schema (logo / OG defaults) and keep schema aligned with reality.

### P2 (Nice to Have)
- [x] Add an OG image route for consistent social previews (`/api/og/[slug]`).
- [x] Add `security.txt` and other trust-building endpoints (optional).
- [x] Add CI workflow to run API tests + web build/lint on PR/push.
- [x] Patch known security advisories in dependencies (Next.js + Hono).

## Acceptance Criteria (Release)
- [ ] `docs/QUALITY-GATE.md` P0 checks all pass.
- [ ] API tests pass and web builds cleanly.
- [ ] SEO surfaces pass sanity checks: robots.txt + sitemap + canonical + noindex where needed.

## Questions to Confirm (Non-blocking)
1. Preferred legal templates (custom company name/address), or generic is acceptable?
2. Do you want to index comparison detail pages (`/compare/a-vs-b`) for select pairs, or keep all `noindex`?
3. Any analytics stack planned (Plausible/GA4)? If yes, cookie consent should be wired to it.
