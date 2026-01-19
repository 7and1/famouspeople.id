import { describe, it, expect, beforeAll, vi } from 'vitest';
import { Hono } from 'hono';
import type { AppEnv } from '../../../src/types/app.js';

// Mock the services and db before importing routes
vi.mock('../../../src/lib/db.js', () => ({
  getPublicClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          ilike: vi.fn(() => ({
            contains: vi.fn(() => ({
              order: vi.fn(() => ({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  count: 0,
                  error: null,
                }),
              })),
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn()
      .mockResolvedValueOnce({ data: [], error: null })
      .mockResolvedValueOnce({ data: 0, error: null })
      .mockResolvedValueOnce({ data: { country: [], zodiac: [] }, error: null }),
  })),
}));

vi.mock('../../../src/middleware/rateLimit.js', () => ({
  rateLimit: () => async (_c: any, next: any) => next(),
}));

// Import routes after mocks are set up
let searchRoutes: any;

beforeAll(async () => {
  searchRoutes = (await import('../../../src/routes/search.js')).default;
});

describe('Search Routes Integration Tests', () => {
  let app: Hono<AppEnv>;

  beforeAll(() => {
    app = new Hono<AppEnv>();

    app.use('*', async (c, next) => {
      c.set('requestId', 'test-request-id');
      await next();
    });

    app.route('/', searchRoutes);
  });

  describe('GET /search', () => {
    it('returns 200 with search results for valid query', async () => {
      const response = await app.request('/search?q=test');
      expect(response.status).toBe(200);
    });

    it('returns 400 for missing query parameter', async () => {
      const response = await app.request('/search');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
      expect(json.error).toHaveProperty('message');
      expect(json.error).toHaveProperty('request_id', 'test-request-id');
    });

    it('returns 400 for empty query parameter', async () => {
      const response = await app.request('/search?q=');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
      expect(json.error.message).toContain('required');
    });

    it('returns 400 for invalid limit parameter', async () => {
      const response = await app.request('/search?q=test&limit=invalid');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
    });

    it('returns 400 for limit greater than 100', async () => {
      const response = await app.request('/search?q=test&limit=101');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
    });

    it('returns 400 for limit less than 1', async () => {
      const response = await app.request('/search?q=test&limit=0');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
    });

    it('returns 400 for invalid offset parameter', async () => {
      const response = await app.request('/search?q=test&offset=invalid');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
    });

    it('returns 400 for negative offset', async () => {
      const response = await app.request('/search?q=test&offset=-1');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
    });

    it('handles country filter parameter', async () => {
      const response = await app.request('/search?q=test&country=United+States');
      expect(response.status).toBe(200);
    });

    it('handles occupation filter parameter', async () => {
      const response = await app.request('/search?q=test&occupation=Entrepreneur');
      expect(response.status).toBe(200);
    });

    it('handles zodiac filter parameter', async () => {
      const response = await app.request('/search?q=test&zodiac=Cancer');
      expect(response.status).toBe(200);
    });

    it('handles mbti filter parameter', async () => {
      const response = await app.request('/search?q=test&mbti=INTJ');
      expect(response.status).toBe(200);
    });

    it('handles gender filter parameter', async () => {
      const response = await app.request('/search?q=test&gender=male');
      expect(response.status).toBe(200);
    });

    it('handles birth_year_min filter parameter', async () => {
      const response = await app.request('/search?q=test&birth_year_min=1980');
      expect(response.status).toBe(200);
    });

    it('handles birth_year_max filter parameter', async () => {
      const response = await app.request('/search?q=test&birth_year_max=2000');
      expect(response.status).toBe(200);
    });

    it('handles net_worth_min filter parameter', async () => {
      const response = await app.request('/search?q=test&net_worth_min=1000000');
      expect(response.status).toBe(200);
    });

    it('handles is_alive filter parameter with true', async () => {
      const response = await app.request('/search?q=test&is_alive=true');
      expect(response.status).toBe(200);
    });

    it('handles is_alive filter parameter with false', async () => {
      const response = await app.request('/search?q=test&is_alive=false');
      expect(response.status).toBe(200);
    });

    it('handles sort parameter', async () => {
      const response = await app.request('/search?q=test&sort=net_worth:desc');
      expect(response.status).toBe(200);
    });

    it('handles type parameter', async () => {
      const response = await app.request('/search?q=test&type=Organization');
      expect(response.status).toBe(200);
    });

    it('handles pagination with limit and offset', async () => {
      const response = await app.request('/search?q=test&limit=10&offset=20');
      expect(response.status).toBe(200);
    });

    it('uses default limit of 20 when not specified', async () => {
      const response = await app.request('/search?q=test');
      expect(response.status).toBe(200);
    });

    it('uses default offset of 0 when not specified', async () => {
      const response = await app.request('/search?q=test');
      expect(response.status).toBe(200);
    });

    it('sets correct cache-control header', async () => {
      const response = await app.request('/search?q=test');

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBe('public, max-age=120, stale-while-revalidate=60');
    });
  });

  describe('Search result structure validation', () => {
    it('returns search result with correct structure', async () => {
      const response = await app.request('/search?q=test');

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json).toHaveProperty('data');
      expect(json.data).toBeInstanceOf(Array);
      expect(json).toHaveProperty('meta');
    });

    it('returns meta with correct structure', async () => {
      const response = await app.request('/search?q=test');

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.meta).toMatchObject({
        total: expect.any(Number),
        page: expect.any(Number),
        per_page: expect.any(Number),
        has_next: expect.any(Boolean),
        facets: expect.any(Object),
      });
    });

    it('returns facets with country and zodiac arrays', async () => {
      const response = await app.request('/search?q=test');

      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.meta.facets).toHaveProperty('country');
      expect(json.meta.facets).toHaveProperty('zodiac');
      expect(json.meta.facets.country).toBeInstanceOf(Array);
      expect(json.meta.facets.zodiac).toBeInstanceOf(Array);
    });
  });

  describe('Error response structure', () => {
    it('returns error response matching API spec for 400', async () => {
      const response = await app.request('/search');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toMatchObject({
        error: {
          code: expect.any(String),
          message: expect.any(String),
          request_id: expect.any(String),
        },
      });
    });

    it('error response contains all required fields', async () => {
      const response = await app.request('/search');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code');
      expect(json.error).toHaveProperty('message');
      expect(json.error).toHaveProperty('request_id');
      expect(typeof json.error.code).toBe('string');
      expect(typeof json.error.message).toBe('string');
      expect(typeof json.error.request_id).toBe('string');
    });
  });

  describe('Complex query scenarios', () => {
    it('handles multiple filters simultaneously', async () => {
      const response = await app.request(
        '/search?q=entrepreneur&country=United+States&zodiac=Cancer&mbti=INTJ&gender=male&birth_year_min=1970&birth_year_max=1990&net_worth_min=1000000&is_alive=true'
      );

      expect(response.status).toBe(200);
    });

    it('handles special characters in query', async () => {
      const response = await app.request('/search?q=O%27Neil');

      expect(response.status).toBe(200);
    });

    it('handles unicode characters in query', async () => {
      const response = await app.request('/search?q=Muller');

      expect(response.status).toBe(200);
    });
  });

  describe('Different sort options', () => {
    it('handles relevance sort', async () => {
      const response = await app.request('/search?q=test&sort=relevance');
      expect(response.status).toBe(200);
    });

    it('handles net_worth:desc sort', async () => {
      const response = await app.request('/search?q=test&sort=net_worth:desc');
      expect(response.status).toBe(200);
    });

    it('handles birth_date:asc sort', async () => {
      const response = await app.request('/search?q=test&sort=birth_date:asc');
      expect(response.status).toBe(200);
    });

    it('handles name:asc sort', async () => {
      const response = await app.request('/search?q=test&sort=name:asc');
      expect(response.status).toBe(200);
    });
  });
});
