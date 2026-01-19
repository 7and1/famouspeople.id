# FamousPeople.id Frontend Component Specification

> Next.js 14+ App Router | Tailwind CSS + shadcn/ui | Cloudflare Pages Edge Runtime

---

## 1. Design System

### 1.1 Color Tokens

```ts
// tailwind.config.ts
const colors = {
  brand: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    900: '#0c4a6e',
  },
  surface: {
    DEFAULT: '#ffffff',
    muted: '#f8fafc',
    subtle: '#f1f5f9',
    border: '#e2e8f0',
  },
  text: {
    primary: '#0f172a',
    secondary: '#475569',
    muted: '#94a3b8',
    inverse: '#ffffff',
  },
  semantic: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  zodiac: {
    fire: '#ef4444',    // Aries, Leo, Sagittarius
    earth: '#84cc16',   // Taurus, Virgo, Capricorn
    air: '#06b6d4',     // Gemini, Libra, Aquarius
    water: '#3b82f6',   // Cancer, Scorpio, Pisces
  },
  mbti: {
    analyst: '#8b5cf6',   // INTJ, INTP, ENTJ, ENTP
    diplomat: '#22c55e',  // INFJ, INFP, ENFJ, ENFP
    sentinel: '#0ea5e9',  // ISTJ, ISFJ, ESTJ, ESFJ
    explorer: '#f59e0b',  // ISTP, ISFP, ESTP, ESFP
  },
}
```

### 1.2 Typography Scale

```css
/* Base: 16px */
--text-xs: 0.75rem;    /* 12px - labels, captions */
--text-sm: 0.875rem;   /* 14px - secondary text */
--text-base: 1rem;     /* 16px - body */
--text-lg: 1.125rem;   /* 18px - lead */
--text-xl: 1.25rem;    /* 20px - h4 */
--text-2xl: 1.5rem;    /* 24px - h3 */
--text-3xl: 1.875rem;  /* 30px - h2 */
--text-4xl: 2.25rem;   /* 36px - h1 */
--text-5xl: 3rem;      /* 48px - hero */
```

```ts
// Font families
const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### 1.3 Spacing Scale

```ts
// 4px base unit
const spacing = {
  px: '1px',
  0: '0',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
}
```

### 1.4 Shadow & Radius

```ts
const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.625rem',  // 10px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
}

const boxShadow = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  card: '0 2px 8px -2px rgb(0 0 0 / 0.08)',
}
```

---

## 2. Component Hierarchy

```
Atomic (atoms/)
├── Avatar
├── Badge
├── Button
├── Icon
├── Input
├── Label
├── Skeleton
├── Spinner
└── Tooltip

Molecular (molecules/)
├── SearchBox
├── FactItem
├── StatCard
├── NavLink
├── Breadcrumb
├── Pagination
├── FilterChip
├── SocialLinks
└── DateDisplay

Organism (organisms/)
├── PersonCard
├── FactGrid
├── RelationshipGraph
├── ComparisonTable
├── FilterBar
├── RankingList
├── PersonHeader
├── RelationshipCard
└── CategoryGrid

Template (templates/)
├── ProfileLayout
├── SearchLayout
├── ListingLayout
├── ComparisonLayout
└── HomeLayout
```

---

## 3. Core Components Specification

### 3.1 PersonCard

```tsx
interface PersonCardProps {
  fpid: string
  slug: string
  name: string
  imageUrl: string | null
  netWorth: number | null
  occupation: string[]
  birthDate: string | null
  country: string[]
  zodiac: Zodiac | null
  mbti: MBTI | null
  variant?: 'default' | 'compact' | 'featured'
  showQuickFacts?: boolean
}
```

```tsx
// organisms/PersonCard.tsx
<article className="group relative rounded-lg border border-surface-border bg-surface p-4 shadow-card transition-shadow hover:shadow-md">
  <Link href={`/people/${slug}`} className="absolute inset-0 z-10" />

  <div className="flex gap-4">
    {/* Avatar */}
    <Avatar
      src={imageUrl}
      alt={name}
      size={variant === 'compact' ? 'sm' : 'md'}
      fallback={name.charAt(0)}
      className="shrink-0"
    />

    {/* Content */}
    <div className="min-w-0 flex-1">
      <h3 className="truncate text-base font-semibold text-text-primary group-hover:text-brand-600">
        {name}
      </h3>

      <p className="mt-0.5 truncate text-sm text-text-secondary">
        {occupation.slice(0, 2).join(', ')}
      </p>

      {showQuickFacts && netWorth && (
        <p className="mt-2 text-sm font-medium text-text-primary">
          ${formatNetWorth(netWorth)}
        </p>
      )}

      {/* Badges */}
      <div className="mt-2 flex flex-wrap gap-1.5">
        {zodiac && <ZodiacBadge sign={zodiac} size="sm" />}
        {mbti && <MBTIBadge type={mbti} size="sm" />}
        {country[0] && <CountryFlag code={country[0]} size="sm" />}
      </div>
    </div>
  </div>
</article>
```

**Variants:**

| Variant | Image Size | Content | Use Case |
|---------|-----------|---------|----------|
| default | 64x64 | Name, occupation, net worth, badges | Search results, listings |
| compact | 40x40 | Name, occupation only | Relationship lists, sidebar |
| featured | 96x96 | Full details + bio excerpt | Homepage highlights |

---

### 3.2 FactGrid

```tsx
interface Fact {
  key: string
  label: string
  value: string | number | null
  unit?: string
  icon?: IconName
  href?: string
}

interface FactGridProps {
  facts: Fact[]
  columns?: 2 | 3 | 4
  variant?: 'default' | 'card' | 'inline'
}
```

```tsx
// organisms/FactGrid.tsx
<dl className={cn(
  'grid gap-4',
  columns === 2 && 'grid-cols-2',
  columns === 3 && 'grid-cols-2 sm:grid-cols-3',
  columns === 4 && 'grid-cols-2 sm:grid-cols-4',
)}>
  {facts.map((fact) => (
    <div
      key={fact.key}
      className={cn(
        variant === 'card' && 'rounded-lg bg-surface-subtle p-4',
        variant === 'inline' && 'flex items-center gap-2',
      )}
    >
      {fact.icon && (
        <Icon name={fact.icon} className="size-4 text-text-muted" />
      )}
      <dt className="text-sm text-text-secondary">{fact.label}</dt>
      <dd className="mt-1 text-lg font-semibold text-text-primary">
        {formatFactValue(fact.value, fact.unit)}
      </dd>
    </div>
  ))}
</dl>
```

---

### 3.3 RelationshipGraph

```tsx
interface GraphNode {
  id: string
  fpid: string
  name: string
  imageUrl: string | null
  type: 'Person' | 'Organization'
}

interface GraphEdge {
  source: string
  target: string
  relationType: RelationType
  label: string
  startDate?: string
  endDate?: string
}

interface RelationshipGraphProps {
  nodes: GraphNode[]
  edges: GraphEdge[]
  centerId: string
  maxDepth?: 1 | 2
  onNodeClick?: (fpid: string) => void
  height?: number
}
```

```tsx
// organisms/RelationshipGraph.tsx (using @xyflow/react)
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react'

const nodeTypes = {
  person: PersonNode,
  organization: OrganizationNode,
}

const edgeTypes = {
  relationship: RelationshipEdge,
}

<div className="relative h-[400px] w-full rounded-lg border border-surface-border bg-surface-subtle">
  <ReactFlow
    nodes={layoutNodes}
    edges={layoutEdges}
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    onNodeClick={(_, node) => onNodeClick?.(node.data.fpid)}
    fitView
    minZoom={0.5}
    maxZoom={1.5}
  >
    <Background color="#e2e8f0" gap={16} />
    <Controls position="bottom-right" />
    <MiniMap
      nodeColor={(node) => node.data.type === 'Person' ? '#0ea5e9' : '#8b5cf6'}
      className="rounded-lg border border-surface-border"
    />
  </ReactFlow>

  {/* Legend */}
  <div className="absolute bottom-4 left-4 rounded-md bg-white/90 p-2 text-xs backdrop-blur">
    <RelationshipLegend />
  </div>
</div>
```

**Edge Colors by Relation Type:**

```ts
const relationColors: Record<RelationType, string> = {
  spouse: '#22c55e',
  ex_spouse: '#f59e0b',
  dated: '#ec4899',
  parent: '#3b82f6',
  child: '#3b82f6',
  sibling: '#8b5cf6',
  colleague: '#6b7280',
  mentor: '#0ea5e9',
  rival: '#ef4444',
  founder: '#f59e0b',
  member: '#6b7280',
  collaborator: '#22c55e',
}
```

---

### 3.4 ComparisonTable

```tsx
interface ComparisonPerson {
  fpid: string
  slug: string
  name: string
  imageUrl: string | null
  netWorth: number | null
  heightCm: number | null
  birthDate: string | null
  country: string[]
  mbti: MBTI | null
  zodiac: Zodiac | null
  occupation: string[]
}

interface ComparisonTableProps {
  people: ComparisonPerson[] // max 4
  highlightDifferences?: boolean
}

type ComparisonField = {
  key: keyof ComparisonPerson
  label: string
  format: (value: any) => string
  compare?: 'higher' | 'lower' | 'none'
}
```

```tsx
// organisms/ComparisonTable.tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[600px] border-collapse">
    <thead>
      <tr className="border-b border-surface-border">
        <th className="w-40 p-4 text-left text-sm font-medium text-text-secondary">
          Attribute
        </th>
        {people.map((person) => (
          <th key={person.fpid} className="p-4 text-center">
            <Link href={`/people/${person.slug}`} className="group inline-block">
              <Avatar
                src={person.imageUrl}
                alt={person.name}
                size="lg"
                className="mx-auto"
              />
              <span className="mt-2 block text-sm font-semibold text-text-primary group-hover:text-brand-600">
                {person.name}
              </span>
            </Link>
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {comparisonFields.map((field) => (
        <tr key={field.key} className="border-b border-surface-border last:border-0">
          <td className="p-4 text-sm text-text-secondary">{field.label}</td>
          {people.map((person) => {
            const value = person[field.key]
            const isHighest = field.compare === 'higher' && isMaxValue(people, field.key, person.fpid)
            const isLowest = field.compare === 'lower' && isMinValue(people, field.key, person.fpid)

            return (
              <td
                key={person.fpid}
                className={cn(
                  'p-4 text-center text-sm',
                  (isHighest || isLowest) && highlightDifferences && 'bg-semantic-success/10 font-semibold text-semantic-success',
                )}
              >
                {field.format(value)}
              </td>
            )
          })}
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

---

### 3.5 FilterBar

```tsx
interface FilterOption {
  value: string
  label: string
  count?: number
}

interface FilterGroup {
  key: string
  label: string
  type: 'single' | 'multi' | 'range'
  options?: FilterOption[]
  min?: number
  max?: number
}

interface ActiveFilter {
  key: string
  value: string | string[] | [number, number]
}

interface FilterBarProps {
  groups: FilterGroup[]
  active: ActiveFilter[]
  onChange: (filters: ActiveFilter[]) => void
  onClear: () => void
  totalResults: number
}
```

```tsx
// organisms/FilterBar.tsx
<div className="sticky top-0 z-20 border-b border-surface-border bg-surface/95 backdrop-blur">
  {/* Mobile toggle */}
  <div className="flex items-center justify-between p-4 lg:hidden">
    <span className="text-sm text-text-secondary">
      {totalResults.toLocaleString()} results
    </span>
    <Button variant="outline" size="sm" onClick={() => setOpen(!open)}>
      <Icon name="filter" className="mr-2 size-4" />
      Filters {active.length > 0 && `(${active.length})`}
    </Button>
  </div>

  {/* Desktop filters */}
  <div className={cn(
    'hidden flex-wrap items-center gap-2 p-4 lg:flex',
    open && 'flex lg:flex',
  )}>
    {groups.map((group) => (
      <FilterDropdown
        key={group.key}
        label={group.label}
        options={group.options}
        type={group.type}
        value={getActiveValue(active, group.key)}
        onChange={(value) => handleFilterChange(group.key, value)}
      />
    ))}

    {active.length > 0 && (
      <Button variant="ghost" size="sm" onClick={onClear}>
        Clear all
      </Button>
    )}
  </div>

  {/* Active filter chips */}
  {active.length > 0 && (
    <div className="flex flex-wrap gap-2 px-4 pb-4">
      {active.map((filter) => (
        <FilterChip
          key={filter.key}
          label={getFilterLabel(groups, filter)}
          onRemove={() => removeFilter(filter.key)}
        />
      ))}
    </div>
  )}
</div>
```

---

### 3.6 RankingList

```tsx
interface RankingItem {
  rank: number
  fpid: string
  slug: string
  name: string
  imageUrl: string | null
  value: number
  previousRank?: number
}

interface RankingListProps {
  items: RankingItem[]
  valueLabel: string
  formatValue: (value: number) => string
  hasMore: boolean
  onLoadMore: () => void
  isLoading?: boolean
}
```

```tsx
// organisms/RankingList.tsx (virtualized with @tanstack/react-virtual)
import { useVirtualizer } from '@tanstack/react-virtual'

const parentRef = useRef<HTMLDivElement>(null)

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 72,
  overscan: 5,
})

<div ref={parentRef} className="h-[600px] overflow-auto">
  <div
    className="relative w-full"
    style={{ height: `${virtualizer.getTotalSize()}px` }}
  >
    {virtualizer.getVirtualItems().map((virtualRow) => {
      const item = items[virtualRow.index]
      const rankChange = item.previousRank ? item.previousRank - item.rank : 0

      return (
        <div
          key={item.fpid}
          className="absolute left-0 top-0 flex w-full items-center gap-4 border-b border-surface-border p-4"
          style={{
            height: `${virtualRow.size}px`,
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          {/* Rank */}
          <div className="flex w-16 items-center gap-2">
            <span className={cn(
              'text-xl font-bold',
              item.rank <= 3 && 'text-brand-600',
            )}>
              #{item.rank}
            </span>
            {rankChange !== 0 && (
              <RankChangeIndicator change={rankChange} />
            )}
          </div>

          {/* Person */}
          <Avatar src={item.imageUrl} alt={item.name} size="sm" />
          <Link
            href={`/people/${item.slug}`}
            className="min-w-0 flex-1 truncate font-medium text-text-primary hover:text-brand-600"
          >
            {item.name}
          </Link>

          {/* Value */}
          <div className="text-right">
            <div className="text-lg font-semibold text-text-primary">
              {formatValue(item.value)}
            </div>
            <div className="text-xs text-text-muted">{valueLabel}</div>
          </div>
        </div>
      )
    })}
  </div>

  {hasMore && (
    <div className="flex justify-center p-4">
      <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
        {isLoading ? <Spinner /> : 'Load more'}
      </Button>
    </div>
  )}
</div>
```

---

### 3.7 Breadcrumb

```tsx
interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  separator?: ReactNode
}
```

```tsx
// molecules/Breadcrumb.tsx
<nav aria-label="Breadcrumb" className="text-sm">
  <ol className="flex flex-wrap items-center gap-1.5">
    {items.map((item, index) => (
      <li key={index} className="flex items-center gap-1.5">
        {index > 0 && (
          <Icon name="chevron-right" className="size-4 text-text-muted" aria-hidden />
        )}
        {item.href ? (
          <Link
            href={item.href}
            className="text-text-secondary hover:text-brand-600"
          >
            {item.label}
          </Link>
        ) : (
          <span className="font-medium text-text-primary" aria-current="page">
            {item.label}
          </span>
        )}
      </li>
    ))}
  </ol>
</nav>
```

---

### 3.8 Pagination

```tsx
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  siblingCount?: number
}
```

```tsx
// molecules/Pagination.tsx
<nav aria-label="Pagination" className="flex items-center justify-center gap-1">
  <Button
    variant="ghost"
    size="icon"
    onClick={() => onPageChange(currentPage - 1)}
    disabled={currentPage === 1}
    aria-label="Previous page"
  >
    <Icon name="chevron-left" className="size-4" />
  </Button>

  {pages.map((page, index) => (
    page === 'ellipsis' ? (
      <span key={`ellipsis-${index}`} className="px-2 text-text-muted">...</span>
    ) : (
      <Button
        key={page}
        variant={page === currentPage ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onPageChange(page)}
        aria-current={page === currentPage ? 'page' : undefined}
      >
        {page}
      </Button>
    )
  ))}

  <Button
    variant="ghost"
    size="icon"
    onClick={() => onPageChange(currentPage + 1)}
    disabled={currentPage === totalPages}
    aria-label="Next page"
  >
    <Icon name="chevron-right" className="size-4" />
  </Button>
</nav>
```

---

### 3.9 SearchBox

```tsx
interface SearchBoxProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (value: string) => void
  placeholder?: string
  suggestions?: SearchSuggestion[]
  isLoading?: boolean
  variant?: 'default' | 'hero'
}

interface SearchSuggestion {
  type: 'person' | 'category' | 'recent'
  label: string
  href: string
  imageUrl?: string
}
```

```tsx
// molecules/SearchBox.tsx
<div className={cn(
  'relative',
  variant === 'hero' && 'w-full max-w-xl',
)}>
  <form onSubmit={(e) => { e.preventDefault(); onSubmit(value) }}>
    <div className="relative">
      <Icon
        name="search"
        className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-text-muted"
      />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search famous people...'}
        className={cn(
          'pl-10 pr-10',
          variant === 'hero' && 'h-14 text-lg',
        )}
        aria-label="Search"
        aria-autocomplete="list"
        aria-controls="search-suggestions"
        aria-expanded={suggestions && suggestions.length > 0}
      />
      {isLoading && (
        <Spinner className="absolute right-3 top-1/2 -translate-y-1/2" />
      )}
    </div>
  </form>

  {/* Suggestions dropdown */}
  {suggestions && suggestions.length > 0 && (
    <div
      id="search-suggestions"
      role="listbox"
      className="absolute top-full z-50 mt-1 w-full rounded-lg border border-surface-border bg-surface shadow-lg"
    >
      {suggestions.map((suggestion, index) => (
        <Link
          key={index}
          href={suggestion.href}
          role="option"
          className="flex items-center gap-3 px-4 py-3 hover:bg-surface-subtle"
        >
          {suggestion.imageUrl && (
            <Avatar src={suggestion.imageUrl} size="xs" />
          )}
          <span className="flex-1">{suggestion.label}</span>
          <Badge variant="secondary" size="sm">{suggestion.type}</Badge>
        </Link>
      ))}
    </div>
  )}
</div>
```

---

## 4. Page Layouts

### 4.1 Person Profile (`/people/[slug]`)

```tsx
// app/people/[slug]/page.tsx
<ProfileLayout>
  <Breadcrumb items={[
    { label: 'Home', href: '/' },
    { label: 'People', href: '/people' },
    { label: person.name },
  ]} />

  <PersonHeader
    name={person.name}
    imageUrl={person.imageUrl}
    occupation={person.occupation}
    country={person.country}
    socialLinks={person.socialLinks}
  />

  <Tabs defaultValue="overview">
    <TabsList>
      <TabsTrigger value="overview">Overview</TabsTrigger>
      <TabsTrigger value="relationships">Relationships</TabsTrigger>
      <TabsTrigger value="timeline">Timeline</TabsTrigger>
    </TabsList>

    <TabsContent value="overview">
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FactGrid
            facts={[
              { key: 'netWorth', label: 'Net Worth', value: person.netWorth, unit: 'USD' },
              { key: 'height', label: 'Height', value: person.heightCm, unit: 'cm' },
              { key: 'birthDate', label: 'Born', value: person.birthDate },
              { key: 'zodiac', label: 'Zodiac', value: person.zodiac },
              { key: 'mbti', label: 'MBTI', value: person.mbti },
              { key: 'country', label: 'Country', value: person.country.join(', ') },
            ]}
            columns={3}
            variant="card"
          />

          <section className="mt-8">
            <h2 className="text-xl font-semibold">Biography</h2>
            <div className="prose mt-4 max-w-none">
              <Markdown content={person.contentMd} />
            </div>
          </section>
        </div>

        <aside>
          <RelatedPeople fpid={person.fpid} />
          <SimilarByMBTI mbti={person.mbti} excludeFpid={person.fpid} />
        </aside>
      </div>
    </TabsContent>

    <TabsContent value="relationships">
      <RelationshipGraph
        nodes={graphNodes}
        edges={graphEdges}
        centerId={person.fpid}
        height={500}
      />
      <RelationshipList relationships={person.relationships} />
    </TabsContent>
  </Tabs>
</ProfileLayout>
```

---

### 4.2 Search Results (`/search`)

```tsx
// app/search/page.tsx
<SearchLayout>
  <div className="mb-8">
    <SearchBox
      value={query}
      onChange={setQuery}
      onSubmit={handleSearch}
      suggestions={suggestions}
      variant="hero"
    />
  </div>

  <FilterBar
    groups={filterGroups}
    active={activeFilters}
    onChange={setActiveFilters}
    onClear={clearFilters}
    totalResults={totalCount}
  />

  <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {results.map((person) => (
      <PersonCard
        key={person.fpid}
        {...person}
        showQuickFacts
      />
    ))}
  </div>

  {results.length === 0 && (
    <EmptyState
      icon="search"
      title="No results found"
      description="Try adjusting your filters or search term"
    />
  )}

  <Pagination
    currentPage={page}
    totalPages={totalPages}
    onPageChange={setPage}
  />
</SearchLayout>
```

---

### 4.3 Category Listing (`/zodiac/[sign]`, `/mbti/[type]`)

```tsx
// app/zodiac/[sign]/page.tsx
<ListingLayout>
  <CategoryHeader
    title={`${zodiacSign} Celebrities`}
    description={zodiacDescriptions[sign]}
    icon={<ZodiacIcon sign={sign} size="lg" />}
    count={totalCount}
  />

  <div className="flex items-center justify-between py-4">
    <SortSelect
      value={sort}
      onChange={setSort}
      options={[
        { value: 'netWorth', label: 'Net Worth' },
        { value: 'name', label: 'Name A-Z' },
        { value: 'birthDate', label: 'Birth Date' },
      ]}
    />
    <ViewToggle value={view} onChange={setView} />
  </div>

  {view === 'grid' ? (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {people.map((person) => (
        <PersonCard key={person.fpid} {...person} />
      ))}
    </div>
  ) : (
    <RankingList
      items={people.map((p, i) => ({ ...p, rank: i + 1 }))}
      valueLabel="Net Worth"
      formatValue={formatNetWorth}
      hasMore={hasNextPage}
      onLoadMore={loadMore}
    />
  )}
</ListingLayout>
```

---

### 4.4 Comparison (`/compare/[slugs]`)

```tsx
// app/compare/[...slugs]/page.tsx
<ComparisonLayout>
  <Breadcrumb items={[
    { label: 'Home', href: '/' },
    { label: 'Compare', href: '/compare' },
    { label: people.map(p => p.name).join(' vs ') },
  ]} />

  <h1 className="text-3xl font-bold">
    {people.map(p => p.name).join(' vs ')}
  </h1>

  <ComparisonTable
    people={people}
    highlightDifferences
  />

  <section className="mt-12">
    <h2 className="text-xl font-semibold">Shared Connections</h2>
    <RelationshipGraph
      nodes={sharedNodes}
      edges={sharedEdges}
      centerId={null}
      height={400}
    />
  </section>

  <section className="mt-12">
    <h2 className="text-xl font-semibold">Compare with others</h2>
    <PersonSelector
      selected={people.map(p => p.fpid)}
      onSelect={handleAddPerson}
      max={4}
    />
  </section>
</ComparisonLayout>
```

---

### 4.5 Rankings (`/richest`, `/tallest`)

```tsx
// app/richest/page.tsx
<ListingLayout>
  <h1 className="text-3xl font-bold">Richest People in the World</h1>
  <p className="mt-2 text-text-secondary">
    Updated {formatDate(lastUpdated)}
  </p>

  <FilterBar
    groups={[
      { key: 'country', label: 'Country', type: 'multi', options: countryOptions },
      { key: 'occupation', label: 'Occupation', type: 'multi', options: occupationOptions },
      { key: 'gender', label: 'Gender', type: 'single', options: genderOptions },
    ]}
    active={filters}
    onChange={setFilters}
    onClear={clearFilters}
    totalResults={totalCount}
  />

  <RankingList
    items={rankings}
    valueLabel="Net Worth"
    formatValue={formatNetWorth}
    hasMore={hasNextPage}
    onLoadMore={loadMore}
    isLoading={isLoading}
  />
</ListingLayout>
```

---

### 4.6 Homepage (`/`)

```tsx
// app/page.tsx
<HomeLayout>
  {/* Hero */}
  <section className="bg-gradient-to-b from-brand-50 to-surface py-16 text-center">
    <h1 className="text-4xl font-bold lg:text-5xl">
      Discover Famous People
    </h1>
    <p className="mx-auto mt-4 max-w-2xl text-lg text-text-secondary">
      Explore profiles, relationships, and facts about celebrities, entrepreneurs, and notable figures.
    </p>
    <div className="mx-auto mt-8 max-w-xl">
      <SearchBox variant="hero" />
    </div>
  </section>

  {/* Browse by Category */}
  <section className="py-12">
    <h2 className="text-2xl font-bold">Browse by Category</h2>
    <CategoryGrid
      categories={[
        { label: 'Zodiac Signs', href: '/zodiac', icon: 'zodiac' },
        { label: 'MBTI Types', href: '/mbti', icon: 'brain' },
        { label: 'Richest', href: '/richest', icon: 'dollar' },
        { label: 'Tallest', href: '/tallest', icon: 'ruler' },
      ]}
    />
  </section>

  {/* Featured People */}
  <section className="py-12">
    <SectionHeader title="Featured" href="/featured" />
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {featured.map((person) => (
        <PersonCard key={person.fpid} {...person} variant="featured" />
      ))}
    </div>
  </section>

  {/* Trending */}
  <section className="py-12">
    <SectionHeader title="Trending" href="/trending" />
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trending.map((person) => (
        <PersonCard key={person.fpid} {...person} />
      ))}
    </div>
  </section>
</HomeLayout>
```

---

## 5. Data Fetching Patterns

### 5.1 Server Components (Default)

```tsx
// app/people/[slug]/page.tsx
export default async function PersonPage({ params }: { params: { slug: string } }) {
  const person = await getPerson(params.slug)

  if (!person) {
    notFound()
  }

  return <PersonProfile person={person} />
}

// lib/api/people.ts
export async function getPerson(slug: string) {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('identities')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single()

  if (error) throw error
  return data
}
```

### 5.2 ISR with Revalidation

```tsx
// app/richest/page.tsx
export const revalidate = 3600 // 1 hour

export default async function RichestPage() {
  const rankings = await getRankings('net_worth')
  return <RankingsPage rankings={rankings} />
}
```

### 5.3 Client-Side with React Query

```tsx
// hooks/useSearch.ts
export function useSearch(query: string, filters: ActiveFilter[]) {
  return useQuery({
    queryKey: ['search', query, filters],
    queryFn: () => searchPeople(query, filters),
    enabled: query.length >= 2,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  })
}

// hooks/useInfiniteRankings.ts
export function useInfiniteRankings(category: string, filters: ActiveFilter[]) {
  return useInfiniteQuery({
    queryKey: ['rankings', category, filters],
    queryFn: ({ pageParam = 0 }) => fetchRankings(category, filters, pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
  })
}
```

### 5.4 Prefetching

```tsx
// app/people/[slug]/page.tsx
export default async function PersonPage({ params }: { params: { slug: string } }) {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['person', params.slug],
    queryFn: () => getPerson(params.slug),
  })

  await queryClient.prefetchQuery({
    queryKey: ['relationships', params.slug],
    queryFn: () => getRelationships(params.slug),
  })

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PersonProfile slug={params.slug} />
    </HydrationBoundary>
  )
}
```

---

## 6. Image Optimization

### 6.1 Next/Image Configuration

```ts
// next.config.ts
const config: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [40, 64, 96, 128, 256],
  },
}
```

### 6.2 Avatar Component

```tsx
// atoms/Avatar.tsx
interface AvatarProps {
  src: string | null
  alt: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

const sizeMap = {
  xs: { px: 32, className: 'size-8' },
  sm: { px: 40, className: 'size-10' },
  md: { px: 64, className: 'size-16' },
  lg: { px: 96, className: 'size-24' },
  xl: { px: 128, className: 'size-32' },
}

export function Avatar({ src, alt, size = 'md', fallback, className }: AvatarProps) {
  const { px, className: sizeClass } = sizeMap[size]

  return (
    <div className={cn(
      'relative overflow-hidden rounded-full bg-surface-subtle',
      sizeClass,
      className,
    )}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={`${px}px`}
          className="object-cover"
          placeholder="blur"
          blurDataURL={generateBlurPlaceholder(px)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-text-muted">
          {fallback ?? alt.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  )
}
```

### 6.3 Blur Placeholder Generation

```ts
// lib/image.ts
export function generateBlurPlaceholder(size: number): string {
  const shimmer = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" fill="#f1f5f9"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${Buffer.from(shimmer).toString('base64')}`
}
```

---

## 7. Accessibility Requirements

### 7.1 ARIA Patterns

| Component | ARIA Role | Required Attributes |
|-----------|-----------|---------------------|
| SearchBox | combobox | `aria-expanded`, `aria-autocomplete`, `aria-controls` |
| FilterDropdown | listbox | `aria-multiselectable`, `aria-label` |
| Pagination | navigation | `aria-label="Pagination"`, `aria-current="page"` |
| Breadcrumb | navigation | `aria-label="Breadcrumb"`, `aria-current="page"` |
| RankingList | list | `aria-label`, row roles |
| RelationshipGraph | img | `aria-label`, `role="img"` for non-interactive |
| Tabs | tablist | `aria-selected`, `aria-controls`, `aria-labelledby` |

### 7.2 Keyboard Navigation

```tsx
// hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation<T>(
  items: T[],
  onSelect: (item: T) => void,
  options?: { loop?: boolean; orientation?: 'horizontal' | 'vertical' }
) {
  const [activeIndex, setActiveIndex] = useState(0)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const { loop = true, orientation = 'vertical' } = options ?? {}
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft'
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight'

    switch (e.key) {
      case prevKey:
        e.preventDefault()
        setActiveIndex((i) => (i > 0 ? i - 1 : loop ? items.length - 1 : i))
        break
      case nextKey:
        e.preventDefault()
        setActiveIndex((i) => (i < items.length - 1 ? i + 1 : loop ? 0 : i))
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        onSelect(items[activeIndex])
        break
      case 'Home':
        e.preventDefault()
        setActiveIndex(0)
        break
      case 'End':
        e.preventDefault()
        setActiveIndex(items.length - 1)
        break
    }
  }, [items, activeIndex, onSelect, options])

  return { activeIndex, setActiveIndex, handleKeyDown }
}
```

### 7.3 Focus Management

```tsx
// hooks/useFocusTrap.ts
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    firstElement?.focus()

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isActive])

  return containerRef
}
```

### 7.4 Skip Links

```tsx
// components/SkipLinks.tsx
export function SkipLinks() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-white"
    >
      Skip to main content
    </a>
  )
}
```

---

## 8. Performance Budgets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | Lighthouse |
| Total JS Bundle | < 100KB gzipped | `next build` |
| Per-route JS | < 50KB | `next build --analyze` |
| Image Weight (avg) | < 50KB | Manual audit |
| API Response Time | < 200ms | Edge function logs |

### 8.1 Bundle Optimization

```ts
// next.config.ts
const config: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  modularizeImports: {
    'lodash-es': {
      transform: 'lodash-es/{{member}}',
    },
  },
}
```

### 8.2 Dynamic Imports

```tsx
// Lazy load heavy components
const RelationshipGraph = dynamic(
  () => import('@/components/organisms/RelationshipGraph'),
  {
    loading: () => <Skeleton className="h-[400px] w-full" />,
    ssr: false,
  }
)

const ComparisonTable = dynamic(
  () => import('@/components/organisms/ComparisonTable'),
  { loading: () => <TableSkeleton rows={10} /> }
)
```

---

## 9. Component File Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                 # Homepage
│   │   └── layout.tsx
│   ├── people/
│   │   └── [slug]/
│   │       ├── page.tsx
│   │       └── loading.tsx
│   ├── search/
│   │   └── page.tsx
│   ├── compare/
│   │   └── [...slugs]/
│   │       └── page.tsx
│   ├── zodiac/
│   │   └── [sign]/
│   │       └── page.tsx
│   ├── mbti/
│   │   └── [type]/
│   │       └── page.tsx
│   ├── richest/
│   │   └── page.tsx
│   ├── tallest/
│   │   └── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── atoms/
│   │   ├── Avatar.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Icon.tsx
│   │   ├── Input.tsx
│   │   ├── Label.tsx
│   │   ├── Skeleton.tsx
│   │   ├── Spinner.tsx
│   │   ├── Tooltip.tsx
│   │   └── index.ts
│   ├── molecules/
│   │   ├── Breadcrumb.tsx
│   │   ├── DateDisplay.tsx
│   │   ├── FactItem.tsx
│   │   ├── FilterChip.tsx
│   │   ├── NavLink.tsx
│   │   ├── Pagination.tsx
│   │   ├── SearchBox.tsx
│   │   ├── SocialLinks.tsx
│   │   ├── StatCard.tsx
│   │   └── index.ts
│   ├── organisms/
│   │   ├── CategoryGrid.tsx
│   │   ├── ComparisonTable.tsx
│   │   ├── FactGrid.tsx
│   │   ├── FilterBar.tsx
│   │   ├── PersonCard.tsx
│   │   ├── PersonHeader.tsx
│   │   ├── RankingList.tsx
│   │   ├── RelationshipCard.tsx
│   │   ├── RelationshipGraph.tsx
│   │   └── index.ts
│   ├── templates/
│   │   ├── ComparisonLayout.tsx
│   │   ├── HomeLayout.tsx
│   │   ├── ListingLayout.tsx
│   │   ├── ProfileLayout.tsx
│   │   ├── SearchLayout.tsx
│   │   └── index.ts
│   └── ui/                          # shadcn/ui components
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── popover.tsx
│       ├── select.tsx
│       ├── tabs.tsx
│       └── ...
│
├── hooks/
│   ├── useDebounce.ts
│   ├── useFocusTrap.ts
│   ├── useInfiniteRankings.ts
│   ├── useKeyboardNavigation.ts
│   ├── useMediaQuery.ts
│   ├── usePerson.ts
│   ├── useRelationships.ts
│   └── useSearch.ts
│
├── lib/
│   ├── api/
│   │   ├── people.ts
│   │   ├── relationships.ts
│   │   ├── search.ts
│   │   └── rankings.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   ├── format.ts
│   │   └── image.ts
│   └── constants/
│       ├── zodiac.ts
│       ├── mbti.ts
│       └── relations.ts
│
├── types/
│   ├── database.ts                  # Generated from Supabase
│   ├── api.ts
│   └── components.ts
│
└── styles/
    └── globals.css
```

---

## 10. Storybook Integration

### 10.1 Configuration

```ts
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
}

export default config
```

### 10.2 Example Story

```tsx
// components/organisms/PersonCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import { PersonCard } from './PersonCard'

const meta: Meta<typeof PersonCard> = {
  title: 'Organisms/PersonCard',
  component: PersonCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'compact', 'featured'],
    },
  },
}

export default meta
type Story = StoryObj<typeof PersonCard>

const basePerson = {
  fpid: 'FP-1971-elon-musk',
  slug: 'elon-musk',
  name: 'Elon Musk',
  imageUrl: '/samples/elon-musk.jpg',
  netWorth: 250000000000,
  occupation: ['Entrepreneur', 'CEO'],
  birthDate: '1971-06-28',
  country: ['USA', 'ZA'],
  zodiac: 'Cancer' as const,
  mbti: 'INTJ' as const,
}

export const Default: Story = {
  args: {
    ...basePerson,
    variant: 'default',
    showQuickFacts: true,
  },
}

export const Compact: Story = {
  args: {
    ...basePerson,
    variant: 'compact',
  },
}

export const Featured: Story = {
  args: {
    ...basePerson,
    variant: 'featured',
    showQuickFacts: true,
  },
}

export const NoImage: Story = {
  args: {
    ...basePerson,
    imageUrl: null,
  },
}

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      <PersonCard {...basePerson} />
      <PersonCard {...basePerson} name="Jeff Bezos" zodiac="Capricorn" mbti="ISTJ" />
      <PersonCard {...basePerson} name="Bill Gates" zodiac="Scorpio" mbti="ENTJ" />
    </div>
  ),
}
```

### 10.3 Accessibility Testing

```tsx
// .storybook/preview.ts
import type { Preview } from '@storybook/react'

const preview: Preview = {
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'aria-roles', enabled: true },
        ],
      },
    },
  },
}

export default preview
```

---

## TypeScript Interfaces Reference

```ts
// types/components.ts

export type Zodiac =
  | 'Aries' | 'Taurus' | 'Gemini' | 'Cancer'
  | 'Leo' | 'Virgo' | 'Libra' | 'Scorpio'
  | 'Sagittarius' | 'Capricorn' | 'Aquarius' | 'Pisces'

export type MBTI =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP'

export type RelationType =
  | 'spouse' | 'ex_spouse' | 'dated'
  | 'parent' | 'child' | 'sibling'
  | 'colleague' | 'mentor' | 'rival'
  | 'founder' | 'member' | 'collaborator'

export type Gender = 'male' | 'female' | 'non-binary' | 'other'

export type IdentityType = 'Person' | 'Organization' | 'Band' | 'Group'

export interface Identity {
  fpid: string
  slug: string
  fullName: string
  type: IdentityType
  netWorth: number | null
  heightCm: number | null
  birthDate: string | null
  deathDate: string | null
  country: string[]
  mbti: MBTI | null
  zodiac: Zodiac | null
  gender: Gender | null
  occupation: string[]
  imageUrl: string | null
  wikipediaUrl: string | null
  socialLinks: Record<string, string>
  meta: Record<string, unknown>
  bioSummary: string | null
  contentMd: string | null
  isPublished: boolean
  createdAt: string
  updatedAt: string
}

export interface Relationship {
  id: number
  sourceFpid: string
  targetFpid: string
  relationType: RelationType
  startDate: string | null
  endDate: string | null
  details: Record<string, unknown>
  createdAt: string
}

export interface SearchResult {
  fpid: string
  slug: string
  name: string
  imageUrl: string | null
  netWorth: number | null
  occupation: string[]
  country: string[]
  zodiac: Zodiac | null
  mbti: MBTI | null
  score: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
```

---

## Edge Runtime Compatibility Notes

Cloudflare Pages Edge Runtime restrictions:

1. **No Node.js APIs** - Use Web APIs only
2. **No `fs` module** - All data via API/KV
3. **No native modules** - Pure JS dependencies only
4. **25ms CPU limit** - Keep computations light
5. **128MB memory** - Optimize payload sizes

```ts
// Ensure edge compatibility
export const runtime = 'edge'
export const preferredRegion = 'auto'
```
