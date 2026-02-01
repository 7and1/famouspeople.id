import type { Metadata } from 'next';
import { getProfileMetaDescription, getCategoryMetaDescription, getSearchMetaDescription } from './meta-descriptions';
import type { PersonProfile } from '../api/types';

const siteName = 'FamousPeople.id';
const MAX_TITLE_LENGTH = 60;

function buildPersonTitle(fullName: string): string {
  const suffix = ` | ${siteName}`;
  const variants = [
    ': Net Worth, Age, Height',
    ': Net Worth, Height',
    ': Net Worth, Age',
    ': Net Worth',
    '',
  ];

  for (const variant of variants) {
    const candidate = `${fullName}${variant}${suffix}`;
    if (candidate.length <= MAX_TITLE_LENGTH) return candidate;
  }

  const baseVariant = ': Net Worth';
  const maxNameLength = Math.max(1, MAX_TITLE_LENGTH - suffix.length - baseVariant.length);
  const truncatedName = fullName.length > maxNameLength
    ? `${fullName.slice(0, Math.max(1, maxNameLength - 1)).trimEnd()}…`
    : fullName;

  const finalTitle = `${truncatedName}${baseVariant}${suffix}`;
  return finalTitle.length > MAX_TITLE_LENGTH ? finalTitle.slice(0, MAX_TITLE_LENGTH - 1) + '…' : finalTitle;
}

export const buildPersonMetadata = (person: PersonProfile): Metadata => {
  const title = buildPersonTitle(person.full_name);
  const description = getProfileMetaDescription(person);
  const canonical = `/people/${person.slug}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://famouspeople.id';

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      images: person.image_url ? [person.image_url] : [],
      type: 'profile',
      url: `${siteUrl}${canonical}`,
      locale: 'en_US',
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: person.image_url ? [person.image_url] : [],
      site: '@famouspeople_id',
    },
  };
};

export const buildCategoryMetadata = (
  title: string,
  description: string,
  options?: { type?: 'zodiac' | 'mbti' | 'occupation'; value?: string; count?: number; topNames?: string[] }
): Metadata => {
  const finalDescription = options?.type && options?.value
    ? getCategoryMetaDescription({
        type: options.type,
        value: options.value,
        count: options.count ?? 0,
        topNames: options.topNames,
      })
    : description;

  const fullTitle = `${title} | ${siteName}`;

  return {
    title: fullTitle,
    description: finalDescription,
    openGraph: {
      title: fullTitle,
      description: finalDescription,
      type: 'website',
      locale: 'en_US',
      siteName,
    },
    twitter: {
      card: 'summary',
      title: fullTitle,
      description: finalDescription,
      site: '@famouspeople_id',
    },
  };
};

export const buildSearchMetadata = (options: { query?: string; totalResults?: number; hasFilters?: boolean }): Metadata => {
  const description = getSearchMetaDescription(options);
  const title = options?.query
    ? `Search: "${options.query}" | ${siteName}`
    : `Search Celebrities | ${siteName}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
};
