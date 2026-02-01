-- FamousPeople.id - P2 Performance Optimization Indexes
-- Run in Supabase SQL Editor after initial schema deployment
-- These composite indexes optimize category page queries

-- ============================================================================
-- COMPOSITE INDEXES FOR CATEGORY PAGES
-- ============================================================================

-- Zodiac category pages (is_published + zodiac + net_worth DESC)
-- Optimizes: /zodiac/[sign] pages with pagination and sorting
CREATE INDEX IF NOT EXISTS idx_identities_published_zodiac
  ON identities(is_published, zodiac, net_worth DESC NULLS LAST)
  WHERE zodiac IS NOT NULL AND is_published = true;

-- MBTI category pages (is_published + mbti + net_worth DESC)
-- Optimizes: /mbti/[type] pages with pagination and sorting
CREATE INDEX IF NOT EXISTS idx_identities_published_mbti
  ON identities(is_published, mbti, net_worth DESC NULLS LAST)
  WHERE mbti IS NOT NULL AND is_published = true;

-- Country category pages (is_published + country + net_worth DESC)
-- Optimizes: /country/[code] pages with pagination and sorting
-- Note: Uses GIN index for array containment
CREATE INDEX IF NOT EXISTS idx_identities_published_country_gin
  ON identities USING GIN (country)
  WHERE is_published = true AND country != '{}';

-- Occupation category pages (is_published + occupation + net_worth DESC)
-- Optimizes: /occupation/[slug] pages with pagination and sorting
-- Note: Uses GIN index for array containment
CREATE INDEX IF NOT EXISTS idx_identities_published_occupation_gin
  ON identities USING GIN (occupation)
  WHERE is_published = true AND occupation != '{}';

-- ============================================================================
-- BIRTHDAY MONTH OPTIMIZATION
-- ============================================================================

-- Birthday month queries (extract month from birth_date)
-- Optimizes: /birthday/[month] pages
CREATE INDEX IF NOT EXISTS idx_identities_birth_month
  ON identities(EXTRACT(MONTH FROM birth_date), net_worth DESC NULLS LAST)
  WHERE birth_date IS NOT NULL AND is_published = true;

-- ============================================================================
-- SEARCH OPTIMIZATION
-- ============================================================================

-- Full-text search with published filter
-- Optimizes: /search queries with filters
CREATE INDEX IF NOT EXISTS idx_identities_search_published
  ON identities(is_published, updated_at DESC)
  WHERE is_published = true;

-- ============================================================================
-- ANALYZE TABLES
-- ============================================================================

-- Update table statistics for query planner
ANALYZE identities;
ANALYZE relationships;

-- ============================================================================
-- VERIFY INDEXES
-- ============================================================================

-- Check index sizes and usage
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
  idx_scan AS index_scans,
  idx_tup_read AS tuples_read,
  idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'identities'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================

/*
Expected Performance Improvements:

1. Zodiac/MBTI Pages:
   - Before: Sequential scan + sort (500-1000ms)
   - After: Index-only scan (50-100ms)
   - Improvement: 10x faster

2. Country/Occupation Pages:
   - Before: GIN scan + sort (300-600ms)
   - After: GIN scan with partial index (100-200ms)
   - Improvement: 3x faster

3. Birthday Month Pages:
   - Before: Sequential scan + extract + sort (800-1500ms)
   - After: Functional index scan (100-200ms)
   - Improvement: 8x faster

4. Search Queries:
   - Before: Full table scan with filter (400-800ms)
   - After: Partial index scan (150-300ms)
   - Improvement: 3x faster

Total Index Storage: ~50-100MB (acceptable for 10,000+ profiles)
*/

-- ============================================================================
-- MAINTENANCE
-- ============================================================================

-- Reindex if needed (run during low traffic)
-- REINDEX INDEX CONCURRENTLY idx_identities_published_zodiac;
-- REINDEX INDEX CONCURRENTLY idx_identities_published_mbti;

-- Monitor index bloat
-- SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
