import { formatCurrencyShort } from '../utils/format';

const MAX_LENGTH = 160;

/**
 * Truncate description to max length with proper word boundary
 */
function truncate(text: string, maxLength = MAX_LENGTH): string {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength - 3) + '...';
}

/**
 * Calculate age from birth date
 */
function calculateAge(birthDate?: string | null): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * Generate meta description for a person profile page
 */
export function getProfileMetaDescription(person: {
  full_name: string;
  net_worth?: number | null;
  height_cm?: number | null;
  birth_date?: string | null;
  occupation?: string[] | null;
  zodiac?: string | null;
  mbti?: string | null;
  country?: string[] | null;
}): string {
  const facts: string[] = [];

  const age = calculateAge(person.birth_date);
  if (person.net_worth) facts.push(`net worth (${formatCurrencyShort(person.net_worth)})`);
  if (person.height_cm) facts.push(`height (${person.height_cm} cm)`);
  if (age) facts.push(`age (${age})`);
  if (person.zodiac) facts.push(`${person.zodiac} zodiac`);
  if (person.mbti) facts.push(`${person.mbti} MBTI`);

  const occupations = person.occupation?.slice(0, 2).join(' & ');
  const intro = occupations
    ? `Discover ${person.full_name}, a ${occupations}.`
    : `Discover ${person.full_name}.`;

  const details = facts.length
    ? `Key facts: ${facts.join(', ')}.`
    : 'Key facts, biography, and relationships.';

  return truncate(`${intro} ${details}`);
}

/**
 * Generate meta description for category pages (zodiac, MBTI, occupation)
 */
export function getCategoryMetaDescription(options: {
  type: 'zodiac' | 'mbti' | 'occupation';
  value: string;
  count: number;
  topNames?: string[];
}): string {
  const { type, value, count, topNames } = options;

  const typeLabel = type === 'mbti' ? value.toUpperCase() : value.charAt(0).toUpperCase() + value.slice(1);
  const typeLower = type === 'mbti' ? value.toUpperCase() : value.toLowerCase();

  if (topNames && topNames.length >= 2) {
    const names = topNames.slice(0, 3).join(', ');
    const description = `Discover ${count} famous ${typeLower} celebrities including ${names}. Complete profiles with net worth, height, zodiac, MBTI and more.`;
    return truncate(description);
  }

  const descriptions: Record<string, string> = {
    zodiac: `Explore ${count} ${typeLabel} celebrities. Complete profiles with net worth, height, relationships, and famous ${typeLower} personality traits.`,
    mbti: `Discover ${count} famous ${typeLabel} personalities. Complete profiles with net worth, height, relationships, and ${typeLabel} characteristics.`,
    occupation: `Browse ${count} famous ${typeLabel}. Complete profiles with net worth, height, zodiac, MBTI, and career highlights.`,
  };

  return truncate(descriptions[type] || `Discover ${count} famous ${typeLabel} with complete profiles including net worth, height, and more.`);
}

/**
 * Generate meta description for search page
 */
export function getSearchMetaDescription(options: {
  query?: string;
  totalResults?: number;
  hasFilters?: boolean;
}): string {
  const { query, totalResults, hasFilters } = options;

  if (query) {
    if (hasFilters) {
      return truncate(`Search results for "${query}". Filter by net worth, height, zodiac, MBTI type, and more to find your favorite celebrities.`);
    }
    return truncate(`Search ${totalResults || ''} celebrity profiles for "${query}". Explore net worth, height, relationships, and more.`);
  }

  if (hasFilters) {
    return truncate('Search celebrity profiles by net worth, height, zodiac sign, MBTI type, occupation, and country. Find your favorite famous people.');
  }

  return truncate('Search thousands of celebrity profiles. Filter by net worth, height, zodiac sign, MBTI type, occupation, and more.');
}

/**
 * Get zodiac-specific descriptions for category pages
 */
export const ZODIAC_DESCRIPTIONS: Record<string, string> = {
  aries: 'Bold, ambitious, and energetic celebrities born under Aries.',
  taurus: 'Steady and grounded Taurus celebrities with lasting influence.',
  gemini: 'Quick-witted Gemini celebrities known for versatility.',
  cancer: 'Intuitive and nurturing Cancer celebrities.',
  leo: 'Charismatic Leo celebrities in the spotlight.',
  virgo: 'Detail-oriented Virgo celebrities across the arts.',
  libra: 'Balanced Libra celebrities with style and charm.',
  scorpio: 'Magnetic Scorpio celebrities with intensity.',
  sagittarius: 'Adventurous Sagittarius celebrities with global reach.',
  capricorn: 'Driven Capricorn celebrities with staying power.',
  aquarius: 'Innovative Aquarius celebrities and changemakers.',
  pisces: 'Creative Pisces celebrities with emotional depth.',
};

/**
 * Get MBTI-specific descriptions for category pages
 */
export function getMbtiDescription(type: string): string {
  const descriptions: Record<string, string> = {
    'INTJ': 'Strategic and analytical INTJ celebrities with visionary thinking.',
    'INTP': 'Innovative and logical INTP celebrities known for intellect.',
    'ENTJ': 'Bold and strategic ENTJ celebrities in leadership.',
    'ENTP': 'Creative and versatile ENTP celebrities and innovators.',
    'INFJ': 'Insightful and empathetic INFJ celebrities with vision.',
    'INFP': 'Creative and idealistic INFP celebrities and artists.',
    'ENFJ': 'Charismatic and inspiring ENFJ celebrities and leaders.',
    'ENFP': 'Enthusiastic and creative ENFP celebrities.',
    'ISTJ': 'Reliable and detail-oriented ISTJ celebrities.',
    'ISFJ': 'Dedicated and supportive ISFJ celebrities.',
    'ESTJ': 'Organized and efficient ESTJ celebrities in management.',
    'ESFJ': 'Caring and social ESFJ celebrities.',
    'ISTP': 'Practical and analytical ISTP celebrities.',
    'ISFP': 'Artistic and gentle ISFP celebrities.',
    'ESTP': 'Energetic and adventurous ESTP celebrities.',
    'ESFP': 'Spontaneous and entertaining ESFP celebrities.',
  };
  return descriptions[type.toUpperCase()] || `Discover famous ${type.toUpperCase()} personalities.`;
}
