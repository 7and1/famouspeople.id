/**
 * Content Quality Utilities
 * Implements minimum content thresholds for profile indexing
 */

export interface ContentQualityMetrics {
  hasMinimumBio: boolean;
  hasBasicFacts: boolean;
  hasRelationships: boolean;
  hasImage: boolean;
  qualityScore: number;
  shouldIndex: boolean;
}

const MIN_BIO_LENGTH = 100;
const MIN_QUALITY_SCORE = 40;

/**
 * Calculate content quality score (0-100)
 */
export function calculateContentQuality(person: {
  bio_summary?: string | null;
  content_md?: string | null;
  net_worth?: number | null;
  height_cm?: number | null;
  birth_date?: string | null;
  occupation?: string[];
  country?: string[];
  image_url?: string | null;
  relationship_count?: number;
}): ContentQualityMetrics {
  let score = 0;

  // Bio content (40 points max)
  const bioLength = (person.bio_summary || '').length + (person.content_md || '').length;
  const hasMinimumBio = bioLength >= MIN_BIO_LENGTH;
  if (hasMinimumBio) {
    score += 40;
  } else if (bioLength > 0) {
    score += Math.floor((bioLength / MIN_BIO_LENGTH) * 40);
  }

  // Basic facts (30 points max)
  let factCount = 0;
  if (person.net_worth) factCount++;
  if (person.height_cm) factCount++;
  if (person.birth_date) factCount++;
  if (person.occupation && person.occupation.length > 0) factCount++;
  if (person.country && person.country.length > 0) factCount++;

  const hasBasicFacts = factCount >= 3;
  score += factCount * 6; // 5 facts × 6 = 30 points

  // Relationships (20 points max)
  const relationshipCount = person.relationship_count || 0;
  const hasRelationships = relationshipCount > 0;
  if (relationshipCount >= 5) {
    score += 20;
  } else if (relationshipCount > 0) {
    score += relationshipCount * 4;
  }

  // Image (10 points)
  const hasImage = !!person.image_url;
  if (hasImage) score += 10;

  // Determine if should be indexed
  const shouldIndex = score >= MIN_QUALITY_SCORE && hasMinimumBio;

  return {
    hasMinimumBio,
    hasBasicFacts,
    hasRelationships,
    hasImage,
    qualityScore: Math.min(score, 100),
    shouldIndex,
  };
}

/**
 * Get content quality badge for display
 */
export function getQualityBadge(score: number): {
  label: string;
  color: string;
  description: string;
} {
  if (score >= 80) {
    return {
      label: 'Excellent',
      color: 'green',
      description: 'Comprehensive profile with rich content',
    };
  } else if (score >= 60) {
    return {
      label: 'Good',
      color: 'blue',
      description: 'Well-documented profile',
    };
  } else if (score >= 40) {
    return {
      label: 'Basic',
      color: 'yellow',
      description: 'Essential information available',
    };
  } else {
    return {
      label: 'Limited',
      color: 'gray',
      description: 'Minimal information available',
    };
  }
}

/**
 * Format last updated timestamp
 */
export function formatLastUpdated(updatedAt?: string | null): string {
  if (!updatedAt) return 'Unknown';

  const date = new Date(updatedAt);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}
