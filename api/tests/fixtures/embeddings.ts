export const mockIdentityRowsForEmbeddings = [
  {
    fpid: 'FP-001',
    full_name: 'Elon Musk',
    bio_summary: 'South African-born American entrepreneur',
    content_md: '# Elon Musk\n\nTech entrepreneur and CEO of Tesla.',
  },
  {
    fpid: 'FP-002',
    full_name: 'Jeff Bezos',
    bio_summary: 'American entrepreneur',
    content_md: null,
  },
  {
    fpid: 'FP-003',
    full_name: 'Albert Einstein',
    bio_summary: 'German-born theoretical physicist',
    content_md: '# Albert Einstein\n\nDeveloped the theory of relativity.',
  },
];

export const mockOpenAIEmbeddingResponse = {
  data: [
    {
      embedding: Array.from({ length: 3072 }, () => Math.random() * 2 - 1),
      index: 0,
      object: 'embedding',
    },
    {
      embedding: Array.from({ length: 3072 }, () => Math.random() * 2 - 1),
      index: 1,
      object: 'embedding',
    },
    {
      embedding: Array.from({ length: 3072 }, () => Math.random() * 2 - 1),
      index: 2,
      object: 'embedding',
    },
  ],
  model: 'text-embedding-3-large',
  object: 'list',
  usage: {
    prompt_tokens: 100,
    total_tokens: 100,
  },
};

export const mockIdentityRowsWithEmbeddings = [
  {
    fpid: 'FP-001',
    slug: 'elon-musk',
    full_name: 'Elon Musk',
    image_url: 'https://example.com/elon.jpg',
    bio_summary: 'South African-born American entrepreneur',
    embedding: Array.from({ length: 3072 }, () => Math.random() * 2 - 1),
  },
  {
    fpid: 'FP-002',
    slug: 'jeff-bezos',
    full_name: 'Jeff Bezos',
    image_url: 'https://example.com/jeff.jpg',
    bio_summary: 'American entrepreneur',
    embedding: Array.from({ length: 3072 }, () => Math.random() * 2 - 1),
  },
  {
    fpid: 'FP-003',
    slug: 'albert-einstein',
    full_name: 'Albert Einstein',
    image_url: 'https://example.com/einstein.jpg',
    bio_summary: 'German-born theoretical physicist',
    embedding: Array.from({ length: 3072 }, () => Math.random() * 2 - 1),
  },
];

export const mockSimilarPeopleResult = [
  {
    fpid: 'FP-002',
    slug: 'jeff-bezos',
    full_name: 'Jeff Bezos',
    image_url: 'https://example.com/jeff.jpg',
    bio_summary: 'American entrepreneur',
    similarity_score: 0.85,
  },
  {
    fpid: 'FP-003',
    slug: 'albert-einstein',
    full_name: 'Albert Einstein',
    image_url: 'https://example.com/einstein.jpg',
    bio_summary: 'German-born theoretical physicist',
    similarity_score: 0.72,
  },
];
