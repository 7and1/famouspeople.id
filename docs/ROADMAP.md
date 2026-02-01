# FamousPeople.id Development Roadmap

## Phase Overview

| Phase | Milestone | Deliverable | Blockers |
|-------|-----------|-------------|----------|
| 1 | Foundation | API + Seeded DB + Basic UI | None |
| 2 | Core Features | Profile pages, search, comparison | Phase 1 |
| 3 | SEO & Content | Schema.org, sitemaps, meta tags | Phase 2 |
| 4 | Performance | Edge caching, Core Web Vitals | Phase 3 |
| **4.5** | **Index Warm-up** | **Drip-feed indexing, GSC monitoring** | **Phase 4** |
| 5 | Launch | Production deployment, GSC | Phase 4.5 |
| 6 | Growth | AI bios, relationship graphs | Phase 5 |

---

## ⚠️ Phase 4.5: Index Warm-up (CRITICAL for New Domains)

### Why This Phase Exists

**Problem:** Google treats new domains publishing 10,000+ pages on Day 1 as potential spam. Result: extended sandbox period, poor indexing.

**Solution:** Drip-feed strategy - gradual page release over 4-6 weeks.

### Indexing Strategy

```
Week 1: 1,000 pages (S-tier celebrities only)
Week 2: +2,000 pages (A-tier)
Week 3: +3,000 pages (B-tier)
Week 4: +4,000 pages (remaining)
```

### Implementation

#### 1. Fame Tier Classification

```sql
-- Add fame_tier column
ALTER TABLE identities ADD COLUMN fame_tier TEXT CHECK (fame_tier IN ('S', 'A', 'B', 'C'));

-- Classify based on Wikipedia sitelinks (from Wikidata)
UPDATE identities SET fame_tier = 'S' WHERE sitelinks > 100;  -- ~1,000 people
UPDATE identities SET fame_tier = 'A' WHERE sitelinks BETWEEN 50 AND 100;
UPDATE identities SET fame_tier = 'B' WHERE sitelinks BETWEEN 20 AND 50;
UPDATE identities SET fame_tier = 'C' WHERE sitelinks < 20;
```

#### 2. Dynamic Sitemap by Tier

```typescript
// Only include tiers that are "released"
function getReleasedTiers(): string[] {
  const launchDate = new Date('2026-02-01');
  const daysSinceLaunch = Math.floor((Date.now() - launchDate.getTime()) / 86400000);

  if (daysSinceLaunch >= 21) return ['S', 'A', 'B', 'C']; // Week 4+
  if (daysSinceLaunch >= 14) return ['S', 'A', 'B'];       // Week 3
  if (daysSinceLaunch >= 7)  return ['S', 'A'];           // Week 2
  return ['S'];                                            // Week 1
}
```

#### 3. noindex for Unreleased Pages

```tsx
// app/people/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const person = await getPerson(params.slug);
  const releasedTiers = getReleasedTiers();

  return {
    robots: releasedTiers.includes(person.fame_tier)
      ? 'index, follow'
      : 'noindex, nofollow'
  };
}
```

### Monitoring Checklist

- [ ] Set up GSC property on Day 1
- [ ] Submit S-tier sitemap only in Week 1
- [ ] Monitor "Pages" report daily for crawl rate
- [ ] Check for "Crawled - currently not indexed" issues
- [ ] Expand sitemap each week based on indexing health
- [ ] Target: 80% of submitted pages indexed before adding more

### Indexing Health Metrics

| Metric | Target | Action if Below |
|--------|--------|-----------------|
| Crawl requests/day | > 100 | Submit more internal links |
| Index coverage | > 80% of submitted | Slow down release |
| Average position (S-tier) | < 50 | Improve content quality |

### Phase 4.5 Tasks

- [ ] Add `fame_tier` column to database
- [ ] Classify 10K profiles into tiers (based on sitelinks)
- [ ] Implement dynamic sitemap filter
- [ ] Add conditional robots meta tag
- [ ] Create GSC monitoring dashboard
- [ ] Set up weekly tier release automation

---

## Phase 1: Foundation

### Backend API Scaffolding

- [ ] Create Hono project structure
  ```
  api/
  ├── src/
  │   ├── index.ts           # Entry point
  │   ├── routes/
  │   │   ├── identities.ts  # /api/identities
  │   │   ├── search.ts      # /api/search
  │   │   └── health.ts      # /api/health
  │   ├── db/
  │   │   └── client.ts      # Supabase client
  │   └── types/
  │       └── identity.ts    # TypeScript types
  ├── Dockerfile
  ├── docker-compose.yml
  └── package.json
  ```
- [ ] Implement endpoints:
  - `GET /api/identities/:slug` - Single profile
  - `GET /api/identities` - List with pagination
  - `GET /api/search?q=` - Trigram search
  - `GET /api/categories/:type` - Filter by occupation/country
  - `GET /api/compare` - Multi-profile comparison
- [ ] Add request validation (zod)
- [ ] Add error handling middleware
- [ ] Configure CORS for frontend domain

### Database Seeding

- [ ] Run Wikidata SPARQL query (`raw_data/wikidata_query.sparql`)
- [ ] Execute `bulk_init.py` to generate markdown files
- [ ] Run `sync_db.py` to populate Supabase
- [ ] Verify 10K+ profiles in `identities` table
- [ ] Spot-check data quality (names, dates, countries)
- [ ] Mark initial batch as `is_published = true`

### Basic Frontend

- [ ] Initialize Next.js 16+ with App Router
  ```
  web/
  ├── app/
  │   ├── layout.tsx
  │   ├── page.tsx           # Homepage
  │   ├── [slug]/
  │   │   └── page.tsx       # Profile page
  │   └── search/
  │       └── page.tsx       # Search results
  ├── components/
  │   ├── ProfileCard.tsx
  │   ├── SearchBar.tsx
  │   └── Navigation.tsx
  ├── lib/
  │   └── api.ts             # API client
  └── tailwind.config.ts
  ```
- [ ] Install Tailwind CSS + shadcn/ui
- [ ] Create homepage with search bar
- [ ] Create basic profile page layout
- [ ] Configure environment variables for API URL

### Local Development Setup

- [ ] Create `docker-compose.dev.yml` with:
  - API container (hot reload)
  - Frontend container (hot reload)
  - Network configuration
- [ ] Document local setup in README
- [ ] Add `.env.example` for both api and web

---

## Phase 2: Core Features

### Person Profile Page (SSR)

- [ ] Implement server-side data fetching
- [ ] Create profile sections:
  - Header (name, image, birth/death)
  - Quick facts (net worth, height, zodiac, MBTI)
  - Biography (content_md rendered)
  - Social links
  - Relationships list
- [ ] Handle missing data gracefully
- [ ] Add loading states
- [ ] Implement 404 for non-existent slugs

### Search Functionality

- [ ] Implement debounced search input
- [ ] Use trigram index for fuzzy matching
- [ ] Display search results with:
  - Profile image thumbnail
  - Name
  - Primary occupation
  - Birth year
- [ ] Add "no results" state
- [ ] Implement keyboard navigation

### Category Pages

- [ ] Create `/occupation/[occupation]` route
- [ ] Create `/country/[country]` route
- [ ] Create `/zodiac/[sign]` route
- [ ] Implement pagination (20 per page)
- [ ] Add sorting options (net worth, birth date, name)
- [ ] Create category index pages

### Comparison Feature

- [ ] Create `/compare` route
- [ ] Implement multi-select (up to 4 profiles)
- [ ] Build comparison table:
  - Side-by-side profile images
  - Row per attribute (net worth, height, age, etc.)
  - Highlight differences
- [ ] Add shareable URL with selected slugs

---

## Phase 3: SEO & Content

### Schema.org Markup

- [ ] Implement `Person` schema for profile pages:
  ```json
  {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "...",
    "birthDate": "...",
    "nationality": "...",
    "jobTitle": "...",
    "sameAs": ["twitter", "instagram", ...]
  }
  ```
- [ ] Add `BreadcrumbList` schema
- [ ] Add `WebSite` schema with SearchAction
- [ ] Add `ItemList` schema for category pages
- [ ] Validate with Google Rich Results Test

### Sitemap Generation

- [ ] Create `/sitemap.xml` route
- [ ] Generate sitemap index (split by decade)
- [ ] Include:
  - All profile pages
  - Category index pages
  - Static pages
- [ ] Set appropriate `lastmod` from `updated_at`
- [ ] Limit 50K URLs per sitemap file

### Meta Tag Optimization

- [ ] Create `generateMetadata` function for profiles:
  - Title: `{name} Net Worth, Height, Age | FamousPeople.id`
  - Description: AI-generated summary or first 160 chars of bio
  - Open Graph image (profile image)
- [ ] Add canonical URLs
- [ ] Add `robots` meta (index, follow)
- [ ] Configure `robots.txt`

### Content Templates

- [ ] Create bio template structure:
  - Introduction paragraph
  - Early life
  - Career highlights
  - Personal life
  - Net worth breakdown
- [ ] Implement template rendering from `content_md`
- [ ] Add FAQ section schema

---

## Phase 4: Performance

### Edge Caching (KV)

- [ ] Set up Cloudflare KV namespace
- [ ] Implement caching strategy:
  - Profile pages: 24h TTL
  - Search results: 1h TTL
  - Category pages: 6h TTL
- [ ] Add cache invalidation on DB update
- [ ] Implement stale-while-revalidate pattern

### Image Optimization

- [ ] Configure Next.js Image component
- [ ] Set up Cloudflare Images or imgproxy
- [ ] Generate responsive image sizes:
  - Thumbnail: 100x100
  - Card: 300x300
  - Profile: 600x600
- [ ] Implement lazy loading
- [ ] Add blur placeholder

### Core Web Vitals Tuning

- [ ] Measure baseline with PageSpeed Insights
- [ ] Target scores:
  - LCP < 2.5s
  - FID < 100ms
  - CLS < 0.1
- [ ] Optimize:
  - [ ] Font loading (preload, font-display: swap)
  - [ ] Critical CSS inlining
  - [ ] JavaScript bundle splitting
  - [ ] Reduce third-party scripts
- [ ] Add performance monitoring (Cloudflare Web Analytics)

### Load Testing

- [ ] Create k6 load test scripts
- [ ] Test scenarios:
  - Homepage: 1000 RPS
  - Profile page: 500 RPS
  - Search: 200 RPS
- [ ] Identify bottlenecks
- [ ] Document capacity limits

---

## Phase 5: Launch

### Cloudflare Deployment

- [ ] Create Cloudflare Pages project
- [ ] Configure build settings:
  - Build command: `npm run build`
  - Output directory: `.next`
- [ ] Set environment variables
- [ ] Deploy API to Cloudflare Workers
- [ ] Configure custom domain

### DNS Cutover

- [ ] Add domain to Cloudflare
- [ ] Configure DNS records:
  - A/AAAA for root domain
  - CNAME for www
- [ ] Enable Cloudflare proxy (orange cloud)
- [ ] Verify SSL certificate

### GSC Submission

- [ ] Verify domain in Google Search Console
- [ ] Submit sitemap.xml
- [ ] Request indexing for key pages:
  - Homepage
  - Top 100 profiles by search volume
  - Category index pages
- [ ] Monitor coverage report

### Monitoring Setup

- [ ] Configure uptime monitoring (Uptime Kuma)
- [ ] Set up error tracking (Sentry)
- [ ] Create Cloudflare dashboard alerts:
  - Error rate > 1%
  - Response time > 500ms
  - Traffic anomalies
- [ ] Configure log retention

---

## Phase 6: Growth

### AI-Generated Bios

- [ ] Create bio generation pipeline:
  - Input: existing data (dates, occupation, relationships)
  - Output: 300-500 word biography
- [ ] Use Claude API for generation
- [ ] Implement human review workflow
- [ ] Store generated content in `content_md`
- [ ] Add "AI-generated" disclosure

### Relationship Graph Visualization

- [ ] Implement graph database view (or query optimization)
- [ ] Create interactive graph component:
  - D3.js or vis.js
  - Node = person
  - Edge = relationship type
- [ ] Add filters by relationship type
- [ ] Implement zoom/pan controls
- [ ] Add "degrees of separation" feature

### User Engagement Features

- [ ] Implement "Similar People" recommendations
  - Based on occupation overlap
  - Based on country
  - Based on birth decade
- [ ] Add "People born today" widget
- [ ] Create "Random profile" feature
- [ ] Implement share buttons (Twitter, Facebook, copy link)

### Analytics Refinement

- [ ] Track key events:
  - Profile views
  - Search queries (anonymized)
  - Category navigation
  - Comparison usage
- [ ] Build analytics dashboard
- [ ] Identify top-performing content
- [ ] Track search-to-profile conversion

---

## Task Breakdown

### Phase 1 Checklist

- [ ] `api/` - Hono project init
- [ ] `api/` - Supabase client setup
- [ ] `api/` - `/api/identities/:slug` endpoint
- [ ] `api/` - `/api/search` endpoint
- [ ] `api/` - Dockerfile + compose
- [ ] `scripts/` - Run data pipeline (10K profiles)
- [ ] `web/` - Next.js project init
- [ ] `web/` - Tailwind + shadcn setup
- [ ] `web/` - Homepage with search
- [ ] `web/` - Basic profile page
- [ ] `docs/` - Local dev README

### Phase 2 Checklist

- [ ] `web/` - Profile page sections
- [ ] `web/` - Search results page
- [ ] `web/` - Occupation category page
- [ ] `web/` - Country category page
- [ ] `web/` - Zodiac category page
- [ ] `web/` - Comparison page
- [ ] `api/` - Category endpoints
- [ ] `api/` - Compare endpoint

### Phase 3 Checklist

- [ ] `web/` - Person schema markup
- [ ] `web/` - BreadcrumbList schema
- [ ] `web/` - Sitemap generation
- [ ] `web/` - Meta tag generation
- [ ] `web/` - robots.txt
- [ ] `web/` - Content template rendering

### Phase 4 Checklist

- [ ] KV caching implementation
- [ ] Image optimization pipeline
- [ ] Font optimization
- [ ] Bundle analysis
- [ ] Core Web Vitals audit
- [ ] Load test execution

### Phase 5 Checklist

- [ ] Cloudflare Pages deployment
- [ ] Workers deployment
- [ ] DNS configuration
- [ ] SSL verification
- [ ] GSC verification
- [ ] Sitemap submission
- [ ] Monitoring setup

### Phase 6 Checklist

- [ ] AI bio generation pipeline
- [ ] Graph visualization component
- [ ] Similar people algorithm
- [ ] Born today widget
- [ ] Share buttons
- [ ] Analytics events

---

## Dependencies

```
Phase 1 Foundation
    │
    ├── Database seeding ──┐
    │                      │
    └── API scaffolding ───┼── Phase 2 Core Features
                           │
        Frontend setup ────┘
              │
              ▼
        Phase 2 Core Features
              │
              ├── Profile pages ────┐
              │                     │
              ├── Search ───────────┼── Phase 3 SEO
              │                     │
              └── Categories ───────┘
                      │
                      ▼
                Phase 3 SEO
                      │
                      ├── Schema markup ────┐
                      │                     │
                      └── Sitemaps ─────────┼── Phase 4 Performance
                                            │
                            Meta tags ──────┘
                                │
                                ▼
                          Phase 4 Performance
                                │
                                ├── Caching ────────┐
                                │                   │
                                └── CWV tuning ─────┼── Phase 5 Launch
                                                    │
                                    Load testing ───┘
                                          │
                                          ▼
                                    Phase 5 Launch
                                          │
                                          └── Phase 6 Growth
```

---

## Definition of Done

### Profile Page

- [ ] Displays all available data fields
- [ ] Handles missing data without errors
- [ ] Loads in < 1s on 3G connection
- [ ] Passes WCAG 2.1 AA accessibility
- [ ] Has valid Person schema markup
- [ ] Renders correctly on mobile/tablet/desktop

### Search

- [ ] Returns results in < 200ms
- [ ] Handles typos (fuzzy matching)
- [ ] Shows "no results" state
- [ ] Supports keyboard navigation
- [ ] Debounces input (300ms)

### Category Page

- [ ] Shows correct profiles for filter
- [ ] Pagination works correctly
- [ ] URL reflects current page/sort
- [ ] Has valid ItemList schema

### Comparison Feature

- [ ] Supports 2-4 profiles
- [ ] Shareable URL works
- [ ] Mobile-friendly layout
- [ ] Loads all profiles in parallel

### SEO

- [ ] All pages have unique title/description
- [ ] Sitemap includes all published profiles
- [ ] Schema validates in Rich Results Test
- [ ] robots.txt allows Googlebot

### Performance

- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] TTI < 3.5s

### Launch

- [ ] Zero downtime deployment
- [ ] SSL grade A+
- [ ] Uptime monitoring active
- [ ] Error tracking configured
- [ ] GSC shows no critical issues
