# FamousPeople.id - SEO Content Strategy

> Programmatic SEO strategy for 10,000+ celebrity profiles with relationship mapping, comparisons, and rankings.

---

## 1. URL Architecture

### Canonical URL Patterns

| Page Type | Pattern | Example |
|-----------|---------|---------|
| Person Profile | `/people/{slug}` | `/people/elon-musk` |
| Zodiac Category | `/zodiac/{sign}` | `/zodiac/cancer` |
| MBTI Category | `/mbti/{type}` | `/mbti/intj` |
| Country Category | `/country/{code}` | `/country/us` |
| Occupation Category | `/occupation/{slug}` | `/occupation/actor` |
| Comparison | `/compare/{slug1}-vs-{slug2}` | `/compare/elon-musk-vs-jeff-bezos` |
| Ranking | `/{ranking-type}` | `/richest`, `/tallest` |
| Birthday Today | `/birthday-today` | `/birthday-today` |
| Birthday Month | `/birthday/{month}` | `/birthday/january` |
| Relationships | `/relationships/{slug}` | `/relationships/elon-musk` |

### Pagination Rules

```
/zodiac/cancer          → Page 1 (canonical)
/zodiac/cancer?page=2   → Page 2 (rel="prev/next")
/zodiac/cancer?page=3   → Page 3 (rel="prev/next")
```

- Use `?page=N` query parameter (not `/page/N/`)
- Page 1 canonical has no query parameter
- Implement `rel="prev"` and `rel="next"` links
- Add `<link rel="canonical">` pointing to paginated URL (not page 1)
- Set `noindex` for pages beyond page 50 (crawl budget)

### Comparison URL Normalization

Always alphabetize slugs to prevent duplicates:
```
/compare/jeff-bezos-vs-elon-musk  → 301 → /compare/elon-musk-vs-jeff-bezos
```

Implementation:
```javascript
function normalizeCompareUrl(slug1, slug2) {
  const sorted = [slug1, slug2].sort();
  return `/compare/${sorted[0]}-vs-${sorted[1]}`;
}
```

---

## 2. Title & Meta Templates

### Person Profile

```yaml
title: "{full_name} - Net Worth, Height, Age, Birthday & Facts | FamousPeople.id"
description: "Learn about {full_name}: ${net_worth_formatted} net worth, {height_cm}cm tall, born {birth_date_formatted}. {occupation_list}. {zodiac} zodiac, {mbti} personality."
```

**Variables:**
- `{full_name}`: "Elon Musk"
- `{net_worth_formatted}`: "$250B"
- `{height_cm}`: "188"
- `{birth_date_formatted}`: "June 28, 1971"
- `{occupation_list}`: "Entrepreneur, CEO, Engineer"
- `{zodiac}`: "Cancer"
- `{mbti}`: "INTJ"

**Character Limits:**
- Title: 55-60 chars (truncate name if needed)
- Description: 150-160 chars

### Zodiac Category

```yaml
title: "Famous {sign} Celebrities ({count}+ People) | FamousPeople.id"
description: "Discover famous {sign} celebrities born between {date_range}. Browse {count}+ actors, musicians, athletes & more. Filter by occupation, country, MBTI."
```

### MBTI Category

```yaml
title: "{type} Celebrities - Famous {type_name} People | FamousPeople.id"
description: "Famous {type} personalities: {type_name}. {trait_summary}. See {count}+ celebrities with this MBTI type including {sample_names}."
```

### Country Category

```yaml
title: "Famous People from {country_name} ({count}+) | FamousPeople.id"
description: "Explore {count}+ famous {demonym} celebrities. Actors, musicians, athletes & more from {country_name}. Filter by zodiac, MBTI, occupation."
```

### Comparison Page

```yaml
title: "{name1} vs {name2}: Net Worth, Height & Age Comparison"
description: "Compare {name1} and {name2}: Who's richer? ({nw1} vs {nw2}), taller ({h1}cm vs {h2}cm), older ({age1} vs {age2}). Full comparison with facts."
```

### Ranking Page

```yaml
# Richest
title: "100 Richest People in the World 2024 | FamousPeople.id"
description: "Who are the richest people on Earth? See the top 100 billionaires ranked by net worth. Updated {date}. #1: {top_name} with {top_nw}."

# Tallest
title: "Tallest Celebrities: 100+ Famous People Over 6'6\" | FamousPeople.id"
description: "The tallest celebrities and famous people ranked by height. From {top_name} at {top_height}cm to basketball players and actors."

# Birthday Today
title: "Famous Birthdays Today - {month} {day} Celebrity Birthdays"
description: "{count} celebrities born on {month} {day}: {sample_names}. See all famous birthdays today with ages and zodiac signs."
```

### Relationships Page

```yaml
title: "{name}'s Relationships: Dating History & Family | FamousPeople.id"
description: "Explore {name}'s complete relationship history. {spouse_count} marriages, {children_count} children. Current partner: {current_partner}."
```

---

## 3. Schema.org Markup

### Person Profile - JSON-LD

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://famouspeople.id/people/elon-musk#person",
  "name": "Elon Musk",
  "alternateName": ["Elon Reeve Musk"],
  "url": "https://famouspeople.id/people/elon-musk",
  "image": {
    "@type": "ImageObject",
    "url": "https://famouspeople.id/images/people/elon-musk.webp",
    "width": 800,
    "height": 800
  },
  "description": "Elon Musk is the CEO of Tesla and SpaceX, owner of X Corp. Known for ambitious goals in EV and space exploration.",
  "birthDate": "1971-06-28",
  "birthPlace": {
    "@type": "Place",
    "name": "Pretoria, South Africa"
  },
  "nationality": [
    {"@type": "Country", "name": "United States"},
    {"@type": "Country", "name": "South Africa"},
    {"@type": "Country", "name": "Canada"}
  ],
  "gender": "Male",
  "height": {
    "@type": "QuantitativeValue",
    "value": 188,
    "unitCode": "CMT"
  },
  "netWorth": {
    "@type": "MonetaryAmount",
    "value": 250000000000,
    "currency": "USD"
  },
  "jobTitle": ["CEO", "Entrepreneur", "Engineer"],
  "worksFor": [
    {"@type": "Organization", "name": "Tesla"},
    {"@type": "Organization", "name": "SpaceX"}
  ],
  "sameAs": [
    "https://twitter.com/elonmusk",
    "https://www.instagram.com/elonmusk",
    "https://en.wikipedia.org/wiki/Elon_Musk",
    "https://www.wikidata.org/wiki/Q317521",
    "https://www.imdb.com/name/nm1907769"
  ],
  "spouse": {
    "@type": "Person",
    "name": "Talulah Riley",
    "url": "https://famouspeople.id/people/talulah-riley"
  },
  "children": [
    {"@type": "Person", "name": "X AE A-XII Musk"}
  ]
}
```

### BreadcrumbList

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://famouspeople.id"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Cancer Celebrities",
      "item": "https://famouspeople.id/zodiac/cancer"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Elon Musk",
      "item": "https://famouspeople.id/people/elon-musk"
    }
  ]
}
```

### ItemList (Rankings/Category Pages)

```json
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "100 Richest People in the World 2024",
  "description": "The wealthiest people on Earth ranked by net worth",
  "numberOfItems": 100,
  "itemListOrder": "https://schema.org/ItemListOrderDescending",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "item": {
        "@type": "Person",
        "name": "Elon Musk",
        "url": "https://famouspeople.id/people/elon-musk",
        "image": "https://famouspeople.id/images/people/elon-musk.webp"
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "item": {
        "@type": "Person",
        "name": "Jeff Bezos",
        "url": "https://famouspeople.id/people/jeff-bezos",
        "image": "https://famouspeople.id/images/people/jeff-bezos.webp"
      }
    }
  ]
}
```

### FAQPage (Person Profile)

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Elon Musk's net worth?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Elon Musk's net worth is estimated at $250 billion USD as of 2024, making him one of the richest people in the world."
      }
    },
    {
      "@type": "Question",
      "name": "How tall is Elon Musk?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Elon Musk is 188 cm (6'2\") tall."
      }
    },
    {
      "@type": "Question",
      "name": "What is Elon Musk's zodiac sign?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Elon Musk was born on June 28, 1971, making him a Cancer."
      }
    },
    {
      "@type": "Question",
      "name": "What is Elon Musk's MBTI personality type?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Elon Musk is believed to be an INTJ (Architect) personality type, known for strategic thinking and innovation."
      }
    }
  ]
}
```

### Comparison Page Schema

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "Elon Musk vs Jeff Bezos Comparison",
  "description": "Side-by-side comparison of Elon Musk and Jeff Bezos",
  "mainEntity": {
    "@type": "ItemList",
    "name": "Celebrity Comparison",
    "numberOfItems": 2,
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "item": {
          "@type": "Person",
          "@id": "https://famouspeople.id/people/elon-musk#person"
        }
      },
      {
        "@type": "ListItem",
        "position": 2,
        "item": {
          "@type": "Person",
          "@id": "https://famouspeople.id/people/jeff-bezos#person"
        }
      }
    ]
  }
}
```

---

## 4. Internal Linking Strategy

### Hub-Spoke Model

```
                    [Homepage]
                        |
        +---------------+---------------+
        |               |               |
   [Zodiac Hub]    [MBTI Hub]     [Country Hub]
        |               |               |
   [/zodiac/leo]   [/mbti/intj]   [/country/us]
        |               |               |
   [Person A]      [Person B]      [Person C]
```

### Person Profile Links

Each person profile MUST include:

1. **Category Breadcrumbs** (3-5 links)
   - Primary zodiac: "Cancer Celebrities"
   - Primary occupation: "Entrepreneurs"
   - Primary country: "American Celebrities"
   - MBTI type: "INTJ Personalities"

2. **Related People** (6-8 links)
   - Same occupation (3-4)
   - Same zodiac (2)
   - Same MBTI (2)

3. **Relationship Links**
   - All relationship targets as links
   - "View full relationship map"

4. **Comparison CTAs** (3-4)
   - "Compare with {similar_person}"
   - Based on: same occupation + similar net worth

### Category Page Links

1. **Sub-filters as links**
   - `/zodiac/cancer` links to `/zodiac/cancer?occupation=actor`
   - Cross-link to MBTI: "Cancer + INTJ celebrities"

2. **Featured profiles** (10 cards with images)

3. **Pagination** with visible page numbers (1-5 + last)

### Comparison Page Links

1. **Link to both profiles**
2. **"Also compare" section** (4 related comparisons)
3. **Category links** for shared attributes

### Link Anchor Text Rules

| Link Type | Anchor Pattern | Example |
|-----------|---------------|---------|
| Person from list | Full name | "Elon Musk" |
| Category | Descriptor + noun | "Cancer celebrities" |
| Comparison | "vs" format | "Compare with Jeff Bezos" |
| Related | "Similar: {name}" | "Similar: Bill Gates" |

---

## 5. Content Generation Rules

### AI Bio Generation

**Prompt Template:**
```
Write a 150-200 word biography for {full_name}.

Known facts:
- Born: {birth_date} in {birth_place}
- Occupation: {occupations}
- Net worth: {net_worth}
- Known for: {notable_works}

Guidelines:
- First sentence: Who they are and primary claim to fame
- Second paragraph: Career highlights
- Third paragraph: Personal life (if notable)
- Neutral, encyclopedic tone
- No speculation or opinions
- Include 2-3 specific achievements with dates
```

### Fact Sentences

Generate structured facts in this format:

```javascript
const factTemplates = {
  net_worth: "{name}'s net worth is estimated at {value}, ranking them #{rank} among {occupation}s.",
  height: "Standing at {height_cm}cm ({height_ft}), {name} is {comparison} the average {occupation}.",
  age: "{name} is {age} years old, born on {birth_date} ({zodiac}).",
  zodiac: "As a {zodiac}, {name} shares their sign with {similar_celeb_1} and {similar_celeb_2}.",
  mbti: "{name} has an {mbti} personality type ({mbti_name}), characterized by {trait_summary}."
};
```

### Comparison Text Generation

**Prompt Template:**
```
Compare {name1} and {name2} in 100 words.

Data:
- {name1}: {age1} years old, {height1}cm, ${nw1} net worth, {occupation1}
- {name2}: {age2} years old, {height2}cm, ${nw2} net worth, {occupation2}

Focus on:
1. Key differences in career paths
2. Interesting commonalities
3. One surprising fact about each

Tone: Informative, engaging, neutral
```

### Content Quality Checklist

- [ ] Bio is 150-300 words
- [ ] Contains at least 3 verifiable facts
- [ ] No duplicate sentences across similar profiles
- [ ] Includes at least 2 internal links naturally
- [ ] FAQ answers are 50-100 words each
- [ ] Comparison text highlights 3+ differences
- [ ] **Data sources cited with dates**

---

## 5.1 E-E-A-T: Data Source Citation

**Critical for Google ranking.** Every factual claim must cite sources.

### Source Display Pattern

```html
<div class="data-source">
  <span class="value">$250 Billion</span>
  <cite>
    Source: <a href="https://forbes.com/billionaires" rel="nofollow">Forbes Real-Time Billionaires</a>
    • Updated: January 2026
  </cite>
</div>
```

### Required Citations by Field

| Field | Primary Source | Fallback | Display Format |
|-------|---------------|----------|----------------|
| net_worth | Forbes, Bloomberg | Celebrity Net Worth | "Source: Forbes, Jan 2026" |
| height_cm | CelebHeights | Wikipedia | "Source: CelebHeights" |
| birth_date | Wikipedia | IMDb | "Source: Wikipedia" |
| mbti | PersonalityDB | Community Vote | "Source: PersonalityDB (voted)" |
| relationships | WhosDatedWho | Wikipedia | "Source: WhosDatedWho" |
| bio_summary | Wikipedia | AI-generated | "Source: Wikipedia" or "AI Summary" |

### Schema.org Citation Markup

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Elon Musk",
  "netWorth": {
    "@type": "MonetaryAmount",
    "value": 250000000000,
    "currency": "USD",
    "sourceOrganization": {
      "@type": "Organization",
      "name": "Forbes",
      "url": "https://forbes.com"
    },
    "dateModified": "2026-01-15"
  }
}
```

### Citation Display Component

```tsx
interface DataCitation {
  source: string;       // "Forbes"
  url?: string;         // "https://forbes.com/..."
  date: string;         // "2026-01-15"
  confidence: 'high' | 'medium' | 'low';
}

// Display as:
// Net Worth: $250B
// 📊 Forbes, Jan 2026 [high confidence]
```

### AI-Generated Content Disclosure

```html
<!-- Required when bio is AI-generated -->
<aside class="ai-disclosure">
  <p>
    <strong>Note:</strong> This biography was generated by AI based on publicly
    available information. Key facts are verified against Wikipedia and IMDb.
    <a href="/about/ai-policy">Learn more</a>
  </p>
</aside>
```

### Why This Matters (E-E-A-T)

| Google Signal | How We Address |
|---------------|----------------|
| **Experience** | Human curation layer, Obsidian editorial workflow |
| **Expertise** | Cross-referenced data from authoritative sources |
| **Authoritativeness** | Citations to Forbes, Wikipedia, IMDb |
| **Trustworthiness** | Transparent sourcing, update dates visible |

---

## 6. Image SEO

### Alt Text Patterns

```yaml
person_primary: "{full_name} - {occupation} portrait photo"
person_thumbnail: "{full_name} thumbnail"
comparison: "{name1} vs {name2} comparison"
category_hero: "Famous {category} celebrities collage"
```

**Examples:**
- "Elon Musk - Entrepreneur and CEO portrait photo"
- "Cancer zodiac celebrities collage featuring Elon Musk, Tom Hanks"

### Image Specifications

| Image Type | Dimensions | Format | Max Size |
|------------|-----------|--------|----------|
| Profile hero | 800x800 | WebP | 100KB |
| Thumbnail | 200x200 | WebP | 20KB |
| OG Image | 1200x630 | WebP | 150KB |
| Category hero | 1200x400 | WebP | 120KB |

### Implementation

```html
<picture>
  <source srcset="/images/people/elon-musk.webp" type="image/webp">
  <source srcset="/images/people/elon-musk.jpg" type="image/jpeg">
  <img
    src="/images/people/elon-musk.jpg"
    alt="Elon Musk - Entrepreneur and CEO portrait photo"
    width="800"
    height="800"
    loading="lazy"
    decoding="async"
  >
</picture>
```

### Image Sitemap

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>https://famouspeople.id/people/elon-musk</loc>
    <image:image>
      <image:loc>https://famouspeople.id/images/people/elon-musk.webp</image:loc>
      <image:title>Elon Musk</image:title>
      <image:caption>Elon Musk - CEO of Tesla and SpaceX</image:caption>
    </image:image>
  </url>
</urlset>
```

---

## 7. Core Web Vitals Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| LCP | < 2.5s | Preload hero image, inline critical CSS |
| INP | < 200ms | Minimize JS, use `requestIdleCallback` |
| CLS | < 0.1 | Set explicit dimensions, font-display: swap |

### Page-Specific Optimizations

**Person Profile:**
- Preload profile image: `<link rel="preload" as="image" href="...">`
- Inline above-fold CSS (< 14KB)
- Defer non-critical JS (related people, comparisons)

**Category/Ranking Pages:**
- Virtual scrolling for 100+ items
- Lazy load images below fold
- Skeleton loaders for cards

**Comparison Pages:**
- Load both images in parallel
- Preconnect to image CDN

### Performance Budget

```yaml
total_page_weight: 500KB
html: 50KB
css: 30KB
js: 150KB
images: 250KB
fonts: 20KB
```

---

## 8. Sitemap Strategy

### Sitemap Index

```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://famouspeople.id/sitemaps/static.xml</loc>
    <lastmod>2026-01-31</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://famouspeople.id/sitemaps/people/1</loc>
    <lastmod>2026-01-31</lastmod>
  </sitemap>
</sitemapindex>
```

**Implementation notes**
- The sitemap index is served at `https://famouspeople.id/sitemap.xml`.
- People sitemaps are paged via `/sitemaps/people/{page}` and powered by the API JSON endpoint `/api/v1/sitemap-data/{page}`.

### Update Frequency

| Content Type | Frequency | Priority |
|--------------|-----------|----------|
| Person profiles (top 1000) | Weekly | 0.9 |
| Person profiles (others) | Monthly | 0.7 |
| Category pages | Weekly | 0.8 |
| Rankings | Daily | 1.0 |
| Birthday today | Daily | 1.0 |
| Comparisons | Monthly | 0.6 |

### Sitemap Generation Logic

```python
# Split people alphabetically (max 10,000 URLs per sitemap)
def generate_people_sitemaps():
    for letter in 'abcdefghijklmnopqrstuvwxyz':
        people = get_people_by_letter(letter)
        if len(people) > 10000:
            # Further split by decade
            split_by_decade(people)
        else:
            generate_sitemap(f'people-{letter}', people)
```

---

## 9. robots.txt & Crawl Budget

### robots.txt

```
User-agent: *
Allow: /

# Block utility pages
Disallow: /api/
Disallow: /admin/
Disallow: /_next/
Disallow: /cdn-cgi/

# Block filtered/sorted variants
Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /*&sort=
Disallow: /*&filter=

# Allow pagination (limited)
Allow: /*?page=

# Block deep pagination
Disallow: /*?page=5*
Disallow: /*?page=6*
Disallow: /*?page=7*
Disallow: /*?page=8*
Disallow: /*?page=9*

# Sitemaps
Sitemap: https://famouspeople.id/sitemap-index.xml

# Crawl-delay for aggressive bots
User-agent: AhrefsBot
Crawl-delay: 10

User-agent: SemrushBot
Crawl-delay: 10
```

### Crawl Budget Optimization

1. **Prioritize valuable pages**
   - Keep top 1000 profiles 2 clicks from homepage
   - Feature rankings prominently in navigation

2. **Reduce index bloat**
   - `noindex` for pages with < 3 people
   - `noindex` for comparison pages with low-fame people
   - Canonical pagination to prevent duplicates

3. **Response codes**
   - 404 for deleted profiles (not soft 404)
   - 301 for renamed slugs (maintain redirect map)
   - 503 with Retry-After for maintenance

4. **Server performance**
   - Target < 200ms TTFB
   - Enable HTTP/2
   - Use CDN for static assets

---

## 10. Measurement

### Google Search Console

**Track by page type:**
```
/people/*          → Person profiles
/zodiac/*          → Zodiac categories
/mbti/*            → MBTI categories
/country/*         → Country categories
/occupation/*      → Occupation categories
/compare/*         → Comparison pages
/richest           → Rankings
/relationships/*   → Relationship pages
```

**Key metrics:**
- Indexed pages vs submitted
- Average position by page type
- CTR by page type
- Crawl stats (pages/day, response times)

### Analytics Events

```javascript
// Track engagement
gtag('event', 'profile_view', {
  person_slug: 'elon-musk',
  person_fame_tier: 'A',
  entry_source: 'zodiac_cancer'
});

gtag('event', 'comparison_view', {
  person_1: 'elon-musk',
  person_2: 'jeff-bezos',
  entry_source: 'profile_cta'
});

gtag('event', 'internal_link_click', {
  link_type: 'related_person',
  from_page: '/people/elon-musk',
  to_page: '/people/jeff-bezos'
});

gtag('event', 'filter_applied', {
  page_type: 'zodiac',
  filter_type: 'occupation',
  filter_value: 'actor'
});
```

### SEO Dashboard Metrics

| Metric | Source | Frequency |
|--------|--------|-----------|
| Indexed pages | GSC API | Daily |
| Organic traffic | GA4 | Daily |
| Avg position by type | GSC API | Weekly |
| Crawl errors | GSC API | Daily |
| Core Web Vitals | CrUX API | Monthly |
| Backlinks | Ahrefs API | Weekly |

### Alerts

- Indexed pages drop > 10%: Immediate
- Traffic drop > 15% WoW: Immediate
- Avg position drop > 3 positions: Daily
- Crawl errors > 100/day: Immediate
- CWV regression: Weekly

---

## 11. Content Templates

### Person Profile Template

```markdown
# {full_name}

> {bio_summary}

## Quick Facts

| Attribute | Value |
|-----------|-------|
| Net Worth | {net_worth_formatted} |
| Height | {height_cm}cm ({height_ft}) |
| Age | {age} years old |
| Birthday | {birth_date_formatted} |
| Zodiac | [{zodiac}](/zodiac/{zodiac_slug}) |
| MBTI | [{mbti}](/mbti/{mbti_lower}) |
| Nationality | {countries_linked} |
| Occupation | {occupations_linked} |

## Biography

{ai_generated_bio}

## Relationships

{relationships_list}

[View full relationship map](/relationships/{slug})

## {name} vs Similar Celebrities

- [Compare with {similar_1}](/compare/{slug}-vs-{similar_1_slug})
- [Compare with {similar_2}](/compare/{slug}-vs-{similar_2_slug})
- [Compare with {similar_3}](/compare/{slug}-vs-{similar_3_slug})

## Related {occupation} Celebrities

{related_by_occupation_grid}

## Other {zodiac} Celebrities

{related_by_zodiac_grid}

## FAQ

### What is {full_name}'s net worth?
{faq_net_worth_answer}

### How tall is {full_name}?
{faq_height_answer}

### What is {full_name}'s zodiac sign?
{faq_zodiac_answer}

### What is {full_name}'s MBTI personality type?
{faq_mbti_answer}

## Sources

- [Wikipedia]({wikipedia_url})
- [IMDb]({imdb_url})
```

### Comparison Page Template

```markdown
# {name1} vs {name2}

> Side-by-side comparison of {name1} and {name2}

## At a Glance

| Attribute | {name1} | {name2} | Winner |
|-----------|---------|---------|--------|
| Net Worth | {nw1} | {nw2} | {nw_winner_icon} |
| Height | {h1}cm | {h2}cm | {h_winner_icon} |
| Age | {age1} | {age2} | - |
| Zodiac | {z1} | {z2} | - |
| MBTI | {m1} | {m2} | - |

## Career Comparison

{ai_career_comparison_text}

## Key Differences

{ai_differences_bullets}

## What They Have in Common

{ai_commonalities_bullets}

## Individual Profiles

- [View {name1}'s full profile](/people/{slug1})
- [View {name2}'s full profile](/people/{slug2})

## Related Comparisons

- [{similar_compare_1}](/compare/{similar_compare_1_url})
- [{similar_compare_2}](/compare/{similar_compare_2_url})
- [{similar_compare_3}](/compare/{similar_compare_3_url})
```

### Category Hub Template

```markdown
# Famous {category_name} Celebrities

> Browse {count}+ {category_adjective} celebrities. Filter by occupation, zodiac, MBTI, and more.

## Featured {category_name}

{featured_grid_10}

## Filter by Occupation

{occupation_pills_linked}

## Filter by Zodiac

{zodiac_pills_linked}

## Filter by MBTI

{mbti_pills_linked}

## All {category_name} ({count})

{paginated_list}

## About {category_name}

{category_description_100_words}

## FAQ

### Who is the most famous {category_singular}?
{faq_most_famous_answer}

### How many {category_name} are in our database?
We have {count} {category_name} in our database, including {sample_names}.
```

### Ranking Page Template

```markdown
# {ranking_title}

> {ranking_description}

**Last updated:** {update_date}

## Top 10 {ranking_short}

{top_10_detailed_cards}

## Full Rankings (1-100)

{sortable_table}

## Methodology

{methodology_description}

## Related Rankings

- [{related_ranking_1}](/related_ranking_1_url)
- [{related_ranking_2}](/related_ranking_2_url)

## FAQ

### Who is the {superlative} {category}?
{faq_top_answer}

### How often is this list updated?
This ranking is updated {frequency} based on {data_source}.
```

---

## Appendix: Implementation Checklist

### Phase 1: Foundation
- [ ] Implement URL routing for all page types
- [ ] Create canonical URL handlers
- [ ] Set up sitemap generation
- [ ] Configure robots.txt
- [ ] Implement schema.org markup

### Phase 2: Content
- [ ] AI bio generation pipeline
- [ ] Fact sentence templates
- [ ] FAQ generation per profile
- [ ] Comparison text generation
- [ ] Image optimization pipeline

### Phase 3: Internal Linking
- [ ] Related people algorithm
- [ ] Category crosslinks
- [ ] Comparison CTAs
- [ ] Breadcrumb implementation

### Phase 4: Measurement
- [ ] GSC property setup
- [ ] GA4 events implementation
- [ ] SEO dashboard creation
- [ ] Alert configuration

### Phase 5: Optimization
- [ ] Core Web Vitals audit
- [ ] Crawl budget analysis
- [ ] Content uniqueness audit
- [ ] Indexation monitoring
