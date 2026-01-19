import type { Metadata } from 'next';
import { getProfileMetaDescription, getCategoryMetaDescription, getSearchMetaDescription } from './meta-descriptions';

const siteName = 'FamousPeople.id';

export const buildPersonMetadata = (person: any): Metadata => {
  const title = `${person.full_name} - Net Worth, Height, Age, Birthday & Facts | ${siteName}`;
  const description = getProfileMetaDescription(person);
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: person.image_url ? [person.image_url] : [],
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

  return {
    title: `${title} | ${siteName}`,
    description: finalDescription,
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
  };
};
