import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.string().optional(),
  PORT: z.coerce.number().int().optional(),

  // App
  SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  LOG_LEVEL: z.string().optional(),

  // Supabase
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DATABASE_SCHEMA: z.string().optional(),

  // Cache / rate limit
  UPSTASH_REDIS_URL: z.string().optional(),
  UPSTASH_REDIS_TOKEN: z.string().optional(),

  // Optional embeddings
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let cachedEnv: Env | null = null;

export const getEnv = (): Env => {
  if (cachedEnv) return cachedEnv;
  cachedEnv = envSchema.parse(process.env);
  return cachedEnv;
};

export const validateEnvForRuntime = (): void => {
  const env = getEnv();

  if (env.NODE_ENV !== 'production') return;

  const missing: string[] = [];

  if (!env.SUPABASE_URL) missing.push('SUPABASE_URL');
  if (!env.SUPABASE_ANON_KEY && !env.SUPABASE_SERVICE_ROLE_KEY) {
    missing.push('SUPABASE_ANON_KEY or SUPABASE_SERVICE_ROLE_KEY');
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

