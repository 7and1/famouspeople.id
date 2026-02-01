---
title: SEO Audit (P2)
date: 2026-01-31
tags: [seo, audit, p2]
---

# FamousPeople.id — /seo audit (2026-01-31)

This audit follows the `seo-expert` scoring system (30 points, target >24) and covers:
technical SEO (robots/sitemaps/canonical/indexing), content quality (word count/structure/links), E‑E‑A‑T (author/about/contact), structured data, and UI compliance (cookie + basic a11y).

## Executive Summary

### P0 release blockers (production)

1. **`https://famouspeople.id/` is serving a domain parking page (not this Next.js app).**
   - Evidence: response HTML contains `window.park` and `set-cookie: parking_session=...`.
2. **`https://api.famouspeople.id/health` returns Cloudflare `HTTP 525` (SSL handshake failed).**
   - Impact: the web app’s API origin is unavailable, so dynamic pages and SEO endpoints can’t function in production.

Until these are fixed, production robots/sitemaps/RSS/security endpoints will not reflect the code in this repository.

### Code status (local)

`node scripts/seo/validate.mjs --start-local` passes (14 pass / 0 warn / 0 fail), including:
- `robots.txt` includes a `Sitemap:` directive
- `sitemap.xml` is valid `sitemapindex` XML
- `rss.xml` is valid RSS XML
- homepage title/meta/canonical/H1 pass
- homepage word count is in the 1500–2000 target range

## Deliverables (implemented)

### Core components (SEO + trust)
- Homepage expanded to ~1550 words with internal links and FAQ JSON‑LD: `web/app/page.tsx`
- About page + editorial standards + contact: `web/app/about/page.tsx`
- Author page + Author schema: `web/app/author/editorial-team/page.tsx`, `web/lib/seo/schema.ts`
- Cookie consent (GDPR-style accept/reject/customize + footer reopen): `web/components/organisms/CookieConsent.tsx`, `web/components/organisms/CookiePreferencesLink.tsx`
- Structured data:
  - Organization + WebSite JSON‑LD (global): `web/app/layout.tsx`, `web/lib/seo/schema.ts`
  - Person + Article + Author + FAQ + Breadcrumb JSON‑LD (profile pages): `web/app/people/[slug]/page.tsx`
- Technical SEO surfaces:
  - `robots.txt`: `web/app/robots.ts`
  - sitemap index + people sitemaps: `web/app/sitemap.xml/route.ts`, `web/app/sitemaps/people/[page]/route.ts`, `web/app/sitemaps/static.xml/route.ts`
  - RSS feeds: `web/app/rss.xml/route.ts`, `web/app/rss/[category]/route.ts`

### Validation scripts
- Local/remote technical SEO validator: `scripts/seo/validate.mjs`
- Competitor comparison extractor: `scripts/seo/competitor-audit.mjs`
- Keyword opportunity generator (optional Keywords Everywhere API): `scripts/seo/keyword-opportunities.mjs`

## Severity-ranked issue list (with fixes)

### P0 (release blockers)

1. **Production domain points to parking (not the Pages app)**
   - Symptoms:
     - `robots.txt` has no `Sitemap:` directive
     - `sitemap.xml` is not valid XML
     - homepage has no title/description/canonical/H1 (because it is not our app)
   - Verify:
     - `node scripts/seo/validate.mjs --base-url https://famouspeople.id`
   - Fix checklist (Cloudflare Pages + DNS):
     - Pages project → **Custom domains**: add `famouspeople.id` and `www.famouspeople.id`
     - DNS:
       - `@` should point to Pages (Cloudflare will provide the required record)
       - `www` should CNAME to the Pages hostname
     - Disable/Remove any “parking”/placeholder service that currently owns the apex.
     - Re-verify:
       - `curl -fsSL https://famouspeople.id/sitemap.xml | head`
       - `node scripts/seo/validate.mjs --base-url https://famouspeople.id` (expect **0 fails**)

2. **API origin is down (`HTTP 525` on `api.famouspeople.id`)**
   - Verify:
     - `curl -fsSIL https://api.famouspeople.id/health | sed -n '1,10p'`
   - Likely causes:
     - Cloudflare SSL mode mismatch (needs **Full (strict)** if using valid origin certs)
     - Tunnel misconfiguration / origin not reachable / wrong service port
     - Origin cert expired or not trusted
   - Fix checklist:
     - Cloudflare SSL/TLS: set **Full (strict)** (then ensure origin cert is correct)
     - Cloudflare Tunnel: hostname `api.famouspeople.id` routes to the API container port `8006`
     - VPS: confirm API container is healthy (`docker ps`, `docker logs -f famouspeople-api`)
     - Confirm path: `GET /health` (not `/api/v1/health`) returns 200/503 JSON

3. **Ensure SEO endpoints stay up even if API is temporarily down**
   - The web app includes a Supabase REST fallback for sitemap/RSS:
     - `web/lib/supabase/rest.ts`
   - Required Cloudflare Pages env vars for fallback:
     - `SUPABASE_URL`
     - `SUPABASE_ANON_KEY`
   - Without these, sitemap/RSS may degrade if the API origin is unavailable.

### P1 (high ROI)

1. **Search Console submission**
   - Add property for `https://famouspeople.id`
   - Submit `https://famouspeople.id/sitemap.xml`
   - Monitor: coverage, crawl stats, rich results

2. **About page depth**
   - Optional: expand `/about` toward 800–1000 words (Module 08 target) for stronger trust signals.

### P2 (nice-to-have)

1. **Add schema validation script**
   - Parse JSON‑LD, assert required schemas exist on key templates (homepage + person page + author page).

2. **Indexing automation**
   - Consider IndexNow ping or similar update signals once production is stable.

## Fix priority (ROI-ranked)

| Priority | Fix | Impact | Effort | Why it matters |
| --- | --- | --- | --- | --- |
| P0 | Fix `famouspeople.id` parking/DNS/Pages | Very high | Medium | Without this, Google cannot crawl the real site at all. |
| P0 | Fix `api.famouspeople.id` (525) | Very high | Medium | Dynamic pages + sitemap/RSS freshness depend on it. |
| P0 | Set `SUPABASE_URL` + `SUPABASE_ANON_KEY` on Pages | High | Low | Keeps sitemap/RSS working during API incidents. |
| P1 | Submit sitemap in GSC | High | Low | Faster discovery + coverage feedback. |
| P1 | Expand `/about` content | Medium | Low | Stronger E‑E‑A‑T signals and trust. |
| P2 | Schema validation automation | Medium | Low | Prevents regressions and rich-result breakage. |

## Technical SEO analysis

### robots.txt
- Expected (code): includes `Sitemap: https://famouspeople.id/sitemap.xml` from `web/app/robots.ts`
- Production: currently missing sitemap directive because production is serving a parking page.

### sitemap.xml
- Expected (code): `sitemapindex` with:
  - `/sitemaps/static.xml`
  - `/sitemaps/people/{page}`
- Production: currently invalid XML (parking page HTML).

### RSS
- Expected (code): `/rss.xml` uses API `/api/v1/latest` with RFC‑822 `pubDate`.
- Production: currently not the app output (parking page HTML).

### Canonical + indexing
- Homepage canonical: set via metadata `alternates.canonical` in `web/app/page.tsx`
- Search pages: `robots: noindex, follow` to prevent crawl traps (`web/app/search/page.tsx`)
- Tier-based gating: person pages `index` only when released tiers allow (`web/app/people/[slug]/page.tsx`)

## Content quality analysis

### Homepage (`/`)
- Word count: ~1550 (target 1500–2000)
- Title length: 57 chars
- Meta description length: 154 chars
- Internal links: 40+ contextual links (rankings/categories/search/about/editorial)

### Person profile pages (`/people/[slug]`)
- Byline + editorial link: points to `/author/editorial-team`
- “Sources” section: renders `data_sources` when available
- JSON‑LD: Person + Article + Author + FAQ + Breadcrumb

## E‑E‑A‑T signals
- Author: `/author/editorial-team` + Author schema
- About: `/about` with methodology/editorial/corrections/contact
- Contact: `mailto:hello@famouspeople.id` (footer + pages)
- Corrections: explicit workflow on About + Editorial pages

## Structured data coverage
- Global: Organization + WebSite JSON‑LD (`web/app/layout.tsx`)
- Homepage: WebPage + FAQPage JSON‑LD (`web/app/page.tsx`)
- Person pages: Person + Article + Author(Person) + FAQPage + BreadcrumbList JSON‑LD (`web/app/people/[slug]/page.tsx`)
- Category/ranking pages: ItemList schema components where applicable (`web/components/seo/ItemListSchema`, etc.)

## UI compliance (cookie/privacy/a11y)
- Cookie consent:
  - Accept / Reject / Customize
  - Stored in localStorage + `fp_consent` cookie
  - Re-open via footer link
- Legal pages: `/privacy`, `/terms`
- A11Y baseline:
  - Skip-to-content link + focusable main region: `web/app/layout.tsx`
  - Navigation active state exposes `aria-current`: `web/components/organisms/Navigation.tsx`
  - Search input has an associated label (sr-only): `web/components/molecules/SearchBox.tsx`

## Keyword research (Top 20 opportunities)

Run:
```bash
node scripts/seo/keyword-opportunities.mjs
```

Optional (volume/CPC/competition via Keywords Everywhere):
```bash
KEYWORDS_EVERYWHERE_API_KEY=... node scripts/seo/keyword-opportunities.mjs
```

## Competitor comparison (Top 3)

Run:
```bash
node scripts/seo/competitor-audit.mjs
```

## Impact timeline (realistic)

| Timeframe | Work | Expected impact |
| --- | --- | --- |
| 0–24h | Fix domain parking + API 525 | Site becomes crawlable + functional; unblock indexing. |
| 1–3d | Submit sitemap + verify rich results | Faster discovery; catch coverage issues early. |
| 1–2w | Iterate on content templates (About depth, internal links) | Higher CTR, better trust, more long-tail wins. |
| 4–12w | pSEO expansion (rankings by occupation/country/etc.) | Larger keyword footprint; sustained growth. |

## How to validate (production)

```bash
node scripts/seo/validate.mjs --base-url https://famouspeople.id
curl -fsSIL https://api.famouspeople.id/health | sed -n '1,12p'
```

### robots.txt
- Present via `web/app/robots.ts`.
- Includes `Sitemap: /sitemap.xml` ✅
- Uses `disallow: ['/search?', '/compare?']` (query-string style rules are unreliable across crawlers; prefer path-based blocking + page-level `noindex`).

### sitemap.xml
- Implemented in `web/app/sitemap.xml/route.ts`.
- Current behavior: fetches `${NEXT_PUBLIC_API_URL}/sitemap/1`, then `res.json()` → **fails**, triggers catch fallback sitemap without people URLs.
- Impact: Large portion of site is not discoverable via sitemap submission.

### RSS
- Implemented in `web/app/rss.xml/route.ts` and `web/app/rss/[category]/route.ts`.
- `/rss.xml` calls `${apiUrl}/search?limit=50` but API `q` is required → feed likely empty.

## Template Scores (Pre-fix)

> Notes: Scores are approximate based on static inspection and will be re-scored after fixes.

### Home (`/`)
- Title: OK (keyword present; likely within 50–60)
- Meta description: too short / not action-led
- Canonical: not explicitly set
- Estimated score: **~21/30**

### Person (`/people/[slug]`)
- Title: frequently too long for real-world names
- Canonical: not explicitly set
- Structured data: strong (Person + Article + FAQ + Breadcrumb + WebSite) ✅
- Robots: tier-based gating exists ✅
- Estimated score: **~20–23/30**

### Category pages (zodiac/mbti/occupation/country)
- Pagination canonical + prev/next: implemented ✅
- Meta descriptions: generally good (truncated to ~160) ✅
- Estimated score: **~24–27/30**

### Search (`/search`)
- Should be `noindex` (currently indexable).
- Canonical strategy for query/filter pages is incomplete (but becomes less important once `noindex` is set).

## Fix Plan (Applied Next)

P0 fixes to apply:
1. Make `/sitemap.xml` produce a correct, people-inclusive sitemap (no fallback-only output).
2. Fix `/rss.xml` to use a valid “latest people” API endpoint (or add such an endpoint).
3. Mark search result pages `noindex` to prevent crawl traps.
4. Control person-page title length + add canonical URLs for person pages.
5. Add privacy + terms pages and link from footer + cookie banner (trust & compliance signals).

---

## Post-fix Status (Implemented)

### Crawl Surfaces
- `/robots.txt`: simplified to disallow only `/api/` and keep sitemap reference.
- `/sitemap.xml`: now returns a **sitemap index** pointing to:
  - `/sitemaps/static.xml`
  - `/sitemaps/people/{page}`
- `/rss.xml`: now uses the new API endpoint `/api/v1/latest` (and emits RFC-822 pubDate values).

### Page Templates
- Person pages:
  - Title length control (≤ 60 chars with fallback variants + truncation)
  - Canonical URLs set via Next metadata alternates
  - Source citations read from `data_sources` (if present) and render safely (non-link sources no longer emit `href=undefined`)
- Search page:
  - `robots: noindex, follow` (prevents crawl traps while keeping UX)
- Legal:
  - `/privacy` and `/terms` created and linked from footer + cookie banner

### Re-score (Estimated)
- Home: **~24–26/30** (stronger meta description + canonical + internal links; snippet section optional)
- Person: **~24–27/30** (title length + canonical + structured data + index gating)
- Category: **~24–27/30** (canonical/pagination already solid)
