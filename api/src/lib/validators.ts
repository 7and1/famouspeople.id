import { z } from 'zod';

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const searchQuerySchema = z.object({
  q: z.string().min(1, 'Query is required'),
  type: z.string().optional().default('Person'),
  country: z.string().optional(),
  occupation: z.string().optional(),
  zodiac: z.string().optional(),
  mbti: z.string().optional(),
  gender: z.string().optional(),
  birth_year_min: z.coerce.number().int().optional(),
  birth_year_max: z.coerce.number().int().optional(),
  net_worth_min: z.coerce.number().int().optional(),
  is_alive: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === 'true' || val === true) return true;
    if (val === 'false' || val === false) return false;
    return undefined;
  }, z.boolean().optional()),
  sort: z.string().optional().default('relevance'),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const relationshipsQuerySchema = z.object({
  type: z.string().optional(),
  direction: z.enum(['outgoing', 'incoming', 'both']).default('both'),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const compareQuerySchema = z.object({
  ids: z.string().min(1),
  fields: z.string().optional(),
});

export const rankingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});
