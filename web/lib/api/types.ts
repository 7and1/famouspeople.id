export interface SearchFacetItem {
  value: string;
  count: number;
}

export interface SearchFacets {
  country: SearchFacetItem[];
  zodiac: SearchFacetItem[];
}

export interface ApiPaginationMeta {
  total: number;
  page: number;
  per_page: number;
  has_next: boolean;
}

export interface PersonSummary {
  fpid: string;
  slug: string;
  full_name: string;
  net_worth: number | null;
  height_cm: number | null;
  birth_date: string | null;
  occupation: string[];
  country: string[];
  zodiac: string | null;
  mbti: string | null;
  image_url: string | null;
  relevance_score?: number | null;
}

export interface PersonProfile extends PersonSummary {
  type: string;
  death_date: string | null;
  gender: string | null;
  wikipedia_url: string | null;
  social_links: Record<string, string | null>;
  bio_summary: string | null;
  content_md?: string | null;
  fame_tier?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  data_sources?: Record<string, unknown>;
  relationship_count?: number | null;
  age?: number | null;
}

export interface RankingItem {
  rank: number;
  fpid: string;
  slug: string;
  full_name: string;
  value: number | null;
  formatted_value: string | null;
}

export interface RankingMeta {
  category: string;
  total: number;
  limit: number;
  updated_at: string;
}

export interface RelationshipNode {
  fpid: string;
  slug: string;
  full_name: string;
  image_url: string | null;
}

export interface RelationshipEdge {
  source_fpid: string;
  target_fpid: string;
  relation_type: string;
  label: string | null;
  start_date: string | null;
  end_date: string | null;
  direction: 'outgoing' | 'incoming';
}

export interface ComparisonResult {
  richest: string | null;
  tallest: string | null;
  oldest: string | null;
  net_worth_total: number;
}

export interface CompareResponse {
  people: PersonProfile[];
  comparison: ComparisonResult;
}

