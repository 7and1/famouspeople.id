import type { PersonProfile } from '../api/types';

const ORG_NAME = 'FamousPeople.id';
const ORG_EMAIL = 'hello@famouspeople.id';

const getOrganizationId = (siteUrl: string) => `${siteUrl}/#organization`;
const getEditorialAuthorId = (siteUrl: string) => `${siteUrl}/author/editorial-team#author`;

export const buildOrganizationSchema = (siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': getOrganizationId(siteUrl),
  name: ORG_NAME,
  url: siteUrl,
  logo: {
    '@type': 'ImageObject',
    url: `${siteUrl}/logo.png`,
  },
  email: ORG_EMAIL,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: ORG_EMAIL,
      availableLanguage: ['en'],
    },
  ],
});

export const buildEditorialAuthorSchema = (siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': getEditorialAuthorId(siteUrl),
  name: `${ORG_NAME} Editorial Team`,
  url: `${siteUrl}/author/editorial-team`,
  jobTitle: 'Editorial Team',
  worksFor: { '@id': getOrganizationId(siteUrl) },
  email: ORG_EMAIL,
});

export const buildPersonSchema = (person: PersonProfile, siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${siteUrl}/people/${person.slug}#person`,
  name: person.full_name,
  url: `${siteUrl}/people/${person.slug}`,
  image: person.image_url ? {
    '@type': 'ImageObject',
    url: person.image_url,
  } : undefined,
  description: person.bio_summary || undefined,
  birthDate: person.birth_date || undefined,
  deathDate: person.death_date || undefined,
  nationality: (person.country || []).map((c: string) => ({ '@type': 'Country', name: c })),
  gender: person.gender ? person.gender.charAt(0).toUpperCase() + person.gender.slice(1) : undefined,
  height: person.height_cm ? { '@type': 'QuantitativeValue', value: person.height_cm, unitCode: 'CMT' } : undefined,
  netWorth: person.net_worth ? { '@type': 'MonetaryAmount', value: person.net_worth, currency: 'USD' } : undefined,
  jobTitle: person.occupation || undefined,
  sameAs: [
    person.wikipedia_url,
    person.social_links?.x ? `https://twitter.com/${person.social_links.x}` : null,
    person.social_links?.twitter ? `https://twitter.com/${person.social_links.twitter}` : null,
    person.social_links?.instagram ? `https://www.instagram.com/${person.social_links.instagram}` : null,
  ].filter(Boolean),
});

export const buildBreadcrumbSchema = (items: { label: string; href: string }[], siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.label,
    item: `${siteUrl}${item.href}`,
  })),
});

export const buildWebsiteSchema = (siteUrl: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  url: siteUrl,
  name: ORG_NAME,
  publisher: {
    '@id': getOrganizationId(siteUrl),
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: `${siteUrl}/search?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export const buildFaqSchema = (person: PersonProfile) => {
  const faqs: { question: string; answer: string }[] = [];

  // Who is {full_name}?
  const primaryOccupation = person.occupation?.[0] || 'public figure';
  faqs.push({
    question: `Who is ${person.full_name}?`,
    answer: person.bio_summary || `${person.full_name} is a ${primaryOccupation}.`,
  });

  // How old is {full_name}?
  if (person.birth_date) {
    const birthYear = new Date(person.birth_date).getFullYear();
    const currentYear = new Date().getFullYear();
    const estimatedAge = currentYear - birthYear;
    faqs.push({
      question: `How old is ${person.full_name}?`,
      answer: `${person.full_name} was born on ${person.birth_date}, making them approximately ${estimatedAge} years old.`,
    });
  }

  // What is {full_name}'s net worth?
  if (person.net_worth) {
    faqs.push({
      question: `What is ${person.full_name}'s net worth?`,
      answer: `${person.full_name}'s net worth is estimated to be around $${person.net_worth.toLocaleString()}.`,
    });
  }

  // How tall is {full_name}?
  if (person.height_cm) {
    const feet = Math.floor(person.height_cm / 30.48);
    const inches = Math.round((person.height_cm % 30.48) / 2.54);
    faqs.push({
      question: `How tall is ${person.full_name}?`,
      answer: `${person.full_name} is ${person.height_cm} cm (${feet}'${inches}") tall.`,
    });
  }

  // What is {full_name}'s zodiac sign?
  if (person.zodiac) {
    faqs.push({
      question: `What is ${person.full_name}'s zodiac sign?`,
      answer: `${person.full_name}'s zodiac sign is ${person.zodiac}.`,
    });
  }

  // What is {full_name}'s MBTI type?
  if (person.mbti) {
    faqs.push({
      question: `What is ${person.full_name}'s MBTI type?`,
      answer: `${person.full_name}'s MBTI type is ${person.mbti}.`,
    });
  }

  // What is {full_name}'s nationality?
  if (person.country && person.country.length > 0) {
    faqs.push({
      question: `What is ${person.full_name}'s nationality?`,
      answer: `${person.full_name} is ${person.country.join(', ')}.`,
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
};

export const buildFaqPageSchema = (faqs: { question: string; answer: string }[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const buildArticleSchema = (person: PersonProfile, siteUrl: string) => {
  const orgId = getOrganizationId(siteUrl);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${person.full_name} - Net Worth, Height, Age & Facts`,
    description: person.bio_summary || `Discover ${person.full_name}'s net worth, height, age, and more.`,
    image: person.image_url || undefined,
    datePublished: person.created_at || new Date().toISOString(),
    dateModified: person.updated_at || person.created_at || new Date().toISOString(),
    author: { '@id': getEditorialAuthorId(siteUrl) },
    publisher: { '@id': orgId },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/people/${person.slug}`,
    },
    mainEntity: {
      '@id': `${siteUrl}/people/${person.slug}#person`,
    },
  };
};

export const buildWebPageSchema = (title: string, description: string, siteUrl: string, path: string) => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: title,
  description: description,
  url: `${siteUrl}${path}`,
  publisher: {
    '@id': getOrganizationId(siteUrl),
  },
});
