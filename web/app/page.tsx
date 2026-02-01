import { HomeLayout } from '../components/templates';
import { CategoryGrid } from '../components/organisms/CategoryGrid';
import { HomeSearch } from '../components/organisms/HomeSearch';
import { RankingList } from '../components/organisms/RankingList';
import { StatCard } from '../components/molecules';
import { getRankings } from '../lib/api/rankings';
import { buildFaqPageSchema, buildWebPageSchema } from '../lib/seo/schema';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FamousPeople.id | Celebrity Net Worth, Height & Facts',
  description: 'Discover celebrity net worth, height, birthdays, zodiac signs, MBTI types, and relationships. Explore 10,000+ profiles with citations and structured data.',
  alternates: { canonical: '/' },
};

export default async function HomePage() {
  const [netWorth, height] = await Promise.all([
    getRankings('net-worth', undefined, 5).catch(() => ({ data: [] })),
    getRankings('height', undefined, 5).catch(() => ({ data: [] })),
  ]);

  const categories = [
    { title: 'Zodiac Signs', description: 'Explore celebrities by zodiac sign.', href: '/zodiac/aries' },
    { title: 'MBTI Types', description: 'Find famous people by personality type.', href: '/mbti/intj' },
    { title: 'Countries', description: 'Browse by country of origin.', href: '/country/us' },
    { title: 'Occupations', description: 'Discover actors, athletes, and more.', href: '/occupation/actor' },
    { title: 'Relationships', description: 'See who dated whom in pop culture.', href: '/relationships/elon-musk' },
    { title: 'Birthdays', description: 'Find celebrities born today.', href: '/birthday-today' },
  ];

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';
  const homepageFaq = [
    {
      question: 'How does FamousPeople.id estimate net worth?',
      answer: 'Net worth is an estimate compiled from public references. Values can vary by source and may change over time. We surface sources whenever available and update profiles as new data appears.',
    },
    {
      question: 'Where does your data come from?',
      answer: 'Our base dataset is derived from public structured sources (such as Wikidata/Wikipedia) and other reputable references. We normalize fields like occupation, country, and dates for consistency.',
    },
    {
      question: 'Can I trust the height and birthday information?',
      answer: 'We aim to use reliable sources and disclose citations for key facts when possible. For some profiles, sources may disagree; in those cases we prioritize higher-confidence references.',
    },
    {
      question: 'Why are some pages marked “noindex”?',
      answer: 'We prevent crawler traps (like open-ended search results) from being indexed while still keeping them usable for people. This helps search engines focus on high-value profile and category pages.',
    },
    {
      question: 'How do I request a correction?',
      answer: 'Email hello@famouspeople.id with the profile URL, the field(s) to correct, and supporting sources. See the About page for details on our correction process.',
    },
    {
      question: 'Do you track users with cookies?',
      answer: 'We use essential cookies for core functionality. Optional cookies are used for measurement only if you consent. You can update your preferences any time via the footer link.',
    },
  ];

  const webPageSchema = buildWebPageSchema(
    'FamousPeople.id: Celebrity Database with Net Worth, Height & Facts',
    metadata.description || '',
    siteUrl,
    '/'
  );

  return (
    <HomeLayout>
      <section className="rounded-3xl border border-surface-border bg-white/80 p-8 shadow-card">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold text-text-primary">FamousPeople.id: Celebrity Database with Net Worth, Height & Facts</h1>
          <p className="mt-4 text-lg text-text-secondary leading-relaxed">
            Discover 10,000+ celebrity profiles with accurate net worth estimates, height measurements, zodiac signs, MBTI personality types, and relationship history. Our fast, global platform delivers verified celebrity data sourced from Wikidata and trusted public records—optimized for researchers, fans, and curious minds worldwide.
          </p>
          <p className="mt-3 text-sm text-text-tertiary">
            By <Link href="/author/editorial-team" className="text-brand-700 hover:underline">FamousPeople.id Editorial Team</Link> · Updated daily
          </p>
        </div>
        <div className="mt-8">
          <HomeSearch />
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Profiles" value="10,000+" description="Curated from Wikidata & trusted sources." accent="Live" />
          <StatCard label="Updates" value="Daily" description="Automated pipelines keep data fresh." accent="Pipeline" />
          <StatCard label="Edge Cache" value="<100ms" description="Global Cloudflare edge delivery." accent="Fast" />
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-white/60 p-8">
        <h2 className="text-2xl font-semibold text-text-primary">What is FamousPeople.id?</h2>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          <strong>FamousPeople.id</strong> is a searchable, structured database of public-figure profiles. Each profile organizes key facts—like net worth estimates, height, age, birthday, and personality traits—into a consistent format that is easy to browse, compare, and share.
        </p>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          If you have ever searched for &quot;{`{name}`} net worth&quot; or &quot;how tall is {`{name}`}&quot;, our goal is to answer quickly with clear sources, internal links to relevant categories, and transparent update signals. Start with <Link href="/search" className="text-brand-600 hover:underline">search</Link>, browse <Link href="/richest" className="text-brand-600 hover:underline">rankings</Link>, or explore by <Link href="/zodiac/aries" className="text-brand-600 hover:underline">zodiac sign</Link>.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-surface-border bg-white p-5">
            <h3 className="font-semibold text-text-primary">Fast answers</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Short, scannable sections with FAQ-style questions for common queries like age, height, birthday, and zodiac.
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-white p-5">
            <h3 className="font-semibold text-text-primary">Built for comparison</h3>
            <p className="mt-2 text-sm text-text-secondary">
              Compare two public figures side by side (net worth, height, age, and more) using the <Link href="/compare" className="text-brand-600 hover:underline">comparison tool</Link>.
            </p>
          </div>
          <div className="rounded-xl border border-surface-border bg-white p-5">
            <h3 className="font-semibold text-text-primary">Editorial standards</h3>
            <p className="mt-2 text-sm text-text-secondary">
              We aim for accuracy and transparency. Learn about sources and corrections on the <Link href="/author/editorial-team" className="text-brand-600 hover:underline">Editorial Team</Link> page.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary">Explore Celebrity Categories</h2>
        <p className="mt-2 text-base text-text-secondary">Jump into curated lists and rankings. Filter famous people by personality type, birth month, profession, or nationality.</p>
        <div className="mt-4">
          <CategoryGrid items={categories} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <RankingList title="Top Net Worth Rankings" items={netWorth.data || []} />
        <RankingList title="Tallest Celebrities" items={height.data || []} />
      </section>

      <section className="rounded-2xl border border-surface-border bg-white/60 p-8">
        <h2 className="text-2xl font-semibold text-text-primary">What Makes FamousPeople.id Different?</h2>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          Most celebrity websites give you basic information. We go deeper. Our database combines financial data, physical statistics, psychological profiles, and relationship networks—all in one place. Whether you are researching the richest celebrities in 2025, comparing heights of NBA players, or exploring which famous people share your zodiac sign, we provide accurate, up-to-date information.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Comprehensive Net Worth Data</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Track celebrity wealth from Hollywood actors to tech billionaires. Our net worth rankings include self-made entrepreneurs like Taylor Swift (first musician to reach billionaire status primarily through music) and business moguls like George Lucas and Steven Spielberg. We monitor salary changes, endorsement deals, and investment portfolios to keep figures current.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Physical Statistics & Measurements</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Find accurate height, age, and birthday information for athletes, actors, musicians, and public figures. Compare physical stats across professions—from the tallest basketball players to the average height of supermodels. All measurements verified against official records and reliable sources.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Personality & Astrology Insights</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Discover which celebrities share your MBTI personality type or zodiac sign. Our database tracks all 16 Myers-Briggs types and 12 zodiac signs, helping you find famous INTJs like Elon Musk, charismatic Leos like Jennifer Lopez, or analytical Virgos like Beyoncé. Great for personality research and entertainment.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Relationship Networks</h3>
            <p className="mt-2 text-sm text-text-secondary leading-relaxed">
              Explore the connections between famous people. Who dated whom in Hollywood? Which business partners built empires together? Our relationship graph visualizes marriages, collaborations, family ties, and professional connections across the celebrity world.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-surface-border bg-gradient-to-br from-brand-50/50 to-transparent p-8">
        <h2 className="text-2xl font-semibold text-text-primary">How We Source Our Celebrity Data</h2>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          Accuracy matters when researching famous people. That is why FamousPeople.id combines multiple authoritative sources to build each profile. Our primary data comes from <Link href="https://www.wikidata.org" className="text-brand-600 hover:underline" target="_blank" rel="noopener">Wikidata</Link>, the structured data repository behind Wikipedia, maintained by a global community of editors. We supplement this with Forbes celebrity net worth reports, official biographies, SEC filings for public figures, and verified social media profiles.
        </p>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          Our automated pipelines refresh data daily, catching new movie releases, album drops, business acquisitions, and life events. When Taylor Swift releases a new album or Elon Musk announces a new venture, our system updates within hours. For financial data, we cross-reference multiple sources including Forbes Billionaires List, Celebrity Net Worth, and Bloomberg Billionaires Index to provide the most accurate estimates available.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">Wikidata</span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">Forbes</span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">Official Biographies</span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">Public Records</span>
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700">Daily Updates</span>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary">Popular Celebrity Searches in 2025</h2>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          The celebrity landscape changes constantly. In 2025, the biggest money moves include Taylor Swift crossing the billion-dollar threshold through her record-breaking Eras Tour, Kim Kardashian scaling SKIMS to a $4 billion valuation, and LeBron James becoming the first active NBA player to reach billionaire status. Our database tracks these shifts in real-time, giving you access to the latest net worth rankings and career milestones.
        </p>
	        <p className="mt-4 text-base text-text-secondary leading-relaxed">
	          Beyond wealth, fans want to know: How tall is Tom Cruise? What is Zendaya&apos;s zodiac sign? Which celebrities are INTJs? FamousPeople.id answers these questions instantly. Our search filters let you combine criteria—find all Leo actresses over 5&apos;8&quot; with estimated net worth above $10 million, or discover which Virgo tech CEOs were born in September. The possibilities for exploration are endless.
	        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/richest" className="rounded-xl border border-surface-border bg-white p-4 transition-shadow hover:shadow-md">
            <h3 className="font-semibold text-text-primary">Richest Celebrities</h3>
            <p className="mt-1 text-xs text-text-secondary">Billionaires & high net worth</p>
          </Link>
          <Link href="/tallest" className="rounded-xl border border-surface-border bg-white p-4 transition-shadow hover:shadow-md">
            <h3 className="font-semibold text-text-primary">Tallest Stars</h3>
            <p className="mt-1 text-xs text-text-secondary">Height rankings & comparisons</p>
          </Link>
	          <Link href="/birthday-today" className="rounded-xl border border-surface-border bg-white p-4 transition-shadow hover:shadow-md">
	            <h3 className="font-semibold text-text-primary">Today&apos;s Birthdays</h3>
	            <p className="mt-1 text-xs text-text-secondary">Celebrities born today</p>
	          </Link>
          <Link href="/search" className="rounded-xl border border-surface-border bg-white p-4 transition-shadow hover:shadow-md">
            <h3 className="font-semibold text-text-primary">Advanced Search</h3>
            <p className="mt-1 text-xs text-text-secondary">Filter by any criteria</p>
          </Link>
        </div>
      </section>

	      <section className="rounded-2xl border border-surface-border bg-white/60 p-8">
	        <h2 className="text-2xl font-semibold text-text-primary">Built for Speed, Designed for Discovery</h2>
	        <p className="mt-4 text-base text-text-secondary leading-relaxed">
	          Slow websites kill curiosity. That is why FamousPeople.id runs on Cloudflare&apos;s global edge network, delivering celebrity profiles in under 100 milliseconds from 300+ locations worldwide. Whether you are in New York, Tokyo, or São Paulo, our pages load instantly. No waiting. No frustration. Just instant access to the celebrity information you want.
	        </p>
	        <p className="mt-4 text-base text-text-secondary leading-relaxed">
	          Our technology stack combines Next.js 16 with server-side rendering for optimal SEO performance. Every page is optimized for search engines with proper structured data (Schema.org), canonical URLs, and meta descriptions. This means when you search for &quot;Taylor Swift net worth 2025&quot; or &quot;Tom Cruise height,&quot; our pages rank higher and load faster than traditional celebrity databases.
	        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Lightning Fast</h3>
              <p className="text-xs text-text-secondary">&lt;100ms global response time</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">Global CDN</h3>
              <p className="text-xs text-text-secondary">300+ edge locations</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">SEO Optimized</h3>
              <p className="text-xs text-text-secondary">Schema.org structured data</p>
            </div>
          </div>
	        </div>
	      </section>

	      <section className="rounded-2xl border border-surface-border bg-white p-8 shadow-card">
	        <h2 className="text-2xl font-semibold text-text-primary">Our Methodology: Quality, Transparency, and Scale</h2>
	        <div className="mt-4 space-y-4 text-base text-text-secondary leading-relaxed">
	          <p>
	            FamousPeople.id is built for programmatic discovery at scale. That only works if the foundation is solid:
	            consistent data, clear citations, and SEO surfaces that search engines can trust. Our profiles are structured,
	            which means we can generate clean page templates for “{`{name}`} net worth”, “{`{name}`} height”, “{`{name}`} birthday”, and more—
	            without thin or duplicated content.
	          </p>
	          <p>
	            We use structured sources (like Wikidata/Wikipedia) as a backbone, then enrich pages with additional facts,
	            relationship edges, and metadata. When sources are available, we show them directly next to the fact so readers
	            can validate claims quickly.
	          </p>
	        </div>
	        <div className="mt-6 grid gap-6 md:grid-cols-3">
	          <div className="rounded-xl border border-surface-border bg-surface-muted p-5">
	            <h3 className="font-semibold text-text-primary">1) Normalize</h3>
	            <p className="mt-2 text-sm text-text-secondary">
	              Clean inputs into consistent fields (occupations, countries, dates, numeric metrics) to prevent messy, low-quality pages.
	            </p>
	          </div>
	          <div className="rounded-xl border border-surface-border bg-surface-muted p-5">
	            <h3 className="font-semibold text-text-primary">2) Cite</h3>
	            <p className="mt-2 text-sm text-text-secondary">
	              Add provenance to key facts (source + last updated). This improves trust and helps readers verify the data.
	            </p>
	          </div>
	          <div className="rounded-xl border border-surface-border bg-surface-muted p-5">
	            <h3 className="font-semibold text-text-primary">3) Index safely</h3>
	            <p className="mt-2 text-sm text-text-secondary">
	              Use sitemaps, canonicals, and <code>noindex</code> where appropriate to avoid crawl traps and focus on high-value pages.
	            </p>
	          </div>
	        </div>
	        <p className="mt-6 text-sm text-text-secondary">
	          Learn more about sources, editorial standards, and corrections on the <Link href="/about" className="text-brand-600 hover:underline">About</Link> page.
	        </p>
	      </section>

	      <section className="rounded-2xl border border-surface-border bg-white/60 p-8">
	        <h2 className="text-2xl font-semibold text-text-primary">Frequently Asked Questions</h2>
	        <p className="mt-2 text-base text-text-secondary">
	          Short answers for the most common questions about our data and how to use the site.
	        </p>
	        <div className="mt-6 space-y-3">
	          {homepageFaq.map((item) => (
	            <details key={item.question} className="rounded-xl border border-surface-border bg-white px-5 py-4">
	              <summary className="cursor-pointer text-sm font-semibold text-text-primary">
	                {item.question}
	              </summary>
	              <p className="mt-3 text-sm text-text-secondary leading-relaxed">
	                {item.answer}
	              </p>
	            </details>
	          ))}
	        </div>
	      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary">Start Exploring Famous People Today</h2>
        <p className="mt-4 text-base text-text-secondary leading-relaxed">
          Ready to dive into the world of celebrity data? Use the search box above to find your favorite actor, musician, athlete, or public figure. Browse our <Link href="/richest" className="text-brand-600 hover:underline">net worth rankings</Link> to see who tops the wealth charts. Check <Link href="/birthday-today" className="text-brand-600 hover:underline">today&apos;s birthdays</Link> to find out which celebrities share your special day. Or explore by <Link href="/zodiac/aries" className="text-brand-600 hover:underline">zodiac sign</Link> and <Link href="/mbti/intj" className="text-brand-600 hover:underline">MBTI type</Link> to discover personality patterns among the famous.
        </p>
	        <p className="mt-4 text-base text-text-secondary leading-relaxed">
	          FamousPeople.id is free to use, requires no registration, and respects your privacy. We believe celebrity information should be accessible, accurate, and fast. Start your search now and discover something new about the world&apos;s most interesting people.
	        </p>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqPageSchema(homepageFaq)) }} />
    </HomeLayout>
  );
}
