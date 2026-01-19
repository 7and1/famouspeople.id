import { describe, it, expect, beforeAll, vi } from 'vitest';
import { Hono } from 'hono';
import { buildComparison } from '../../../src/services/compare.js';
import type { AppEnv } from '../../../src/types/app.js';
import type { PersonProfile } from '../../../src/services/identities.js';
import { mockIdentityRows } from '../../fixtures/identities.js';

// Mock the services before importing routes
vi.mock('../../../src/lib/db.js', () => ({
  getPublicClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ data: mockIdentityRows, error: null }),
        })),
      })),
    })),
    rpc: vi.fn(),
  })),
}));

vi.mock('../../../src/middleware/rateLimit.js', () => ({
  rateLimit: () => async (_c: any, next: any) => next(),
}));

// Import routes after mocks are set up
let compareRoutes: any;

beforeAll(async () => {
  compareRoutes = (await import('../../../src/routes/compare.js')).default;
});

describe('Compare Routes Integration Tests', () => {
  let app: Hono<AppEnv>;

  beforeAll(() => {
    app = new Hono<AppEnv>();

    app.use('*', async (c, next) => {
      c.set('requestId', 'test-request-id');
      await next();
    });

    app.route('/', compareRoutes);
  });

  describe('GET /compare', () => {
    it('returns 200 with comparison data for valid slugs', async () => {
      const response = await app.request('/compare?ids=elon-musk,jeff-bezos');
      expect(response.status).toBe(200);
    });

    it('returns 400 for missing ids parameter', async () => {
      const response = await app.request('/compare');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json).toHaveProperty('error');
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
      expect(json.error).toHaveProperty('message');
      expect(json.error).toHaveProperty('request_id', 'test-request-id');
    });

    it('returns 400 for empty ids parameter', async () => {
      const response = await app.request('/compare?ids=');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_QUERY');
    });

    it('returns 400 for single person (less than 2)', async () => {
      const response = await app.request('/compare?ids=elon-musk');

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_COMPARE_COUNT');
      expect(json.error.message).toContain('2-5 people');
      expect(json.error.message).toContain('got 1');
    });

    it('returns 400 for more than 5 people', async () => {
      const response = await app.request(
        '/compare?ids=elon-musk,jeff-bezos,bill-gates,mark-zuckerberg,steve-jobs,tim-cook'
      );

      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toHaveProperty('code', 'INVALID_COMPARE_COUNT');
      expect(json.error.message).toContain('2-5 people');
      expect(json.error.message).toContain('got 6');
    });

    it('compares exactly 2 people', async () => {
      const response = await app.request('/compare?ids=elon-musk,jeff-bezos');
      expect(response.status).toBe(200);
    });

    it('compares exactly 3 people', async () => {
      const response = await app.request('/compare?ids=elon-musk,jeff-bezos,albert-einstein');
      expect(response.status).toBe(200);
    });

    it('compares exactly 5 people (maximum)', async () => {
      const response = await app.request(
        '/compare?ids=elon-musk,jeff-bezos,albert-einstein,bill-gates,mark-zuckerberg'
      );
      expect(response.status).toBe(200);
    });

    it('handles whitespace in ids parameter', async () => {
      const response = await app.request('/compare?ids= elon-musk , jeff-bezos ');
      expect(response.status).toBe(200);
    });

    it('handles empty entries in comma-separated ids', async () => {
      const response = await app.request('/compare?ids=elon-musk,,jeff-bezos,');
      expect(response.status).toBe(200);
    });

    it('sets correct cache-control header', async () => {
      const response = await app.request('/compare?ids=elon-musk,jeff-bezos');
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBe('public, max-age=300, stale-while-revalidate=60');
    });
  });

  describe('Error response structure', () => {
    it('returns error response matching API spec for 400', async () => {
      const response = await app.request('/compare');

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
  });

  describe('Build comparison logic tests', () => {
    it('correctly identifies richest person', () => {
      const people: PersonProfile[] = [
        { ...mockIdentityRows[0], net_worth: 250000000000, slug: 'elon-musk' } as PersonProfile,
        { ...mockIdentityRows[1], net_worth: 150000000000, slug: 'jeff-bezos' } as PersonProfile,
      ];

      const result = buildComparison(people);
      expect(result.comparison.richest).toBe('elon-musk');
    });

    it('correctly identifies tallest person', () => {
      const people: PersonProfile[] = [
        { ...mockIdentityRows[0], height_cm: 188, slug: 'elon-musk' } as PersonProfile,
        { ...mockIdentityRows[1], height_cm: 171, slug: 'jeff-bezos' } as PersonProfile,
      ];

      const result = buildComparison(people);
      expect(result.comparison.tallest).toBe('elon-musk');
    });

    it('correctly identifies oldest person', () => {
      const people: PersonProfile[] = [
        { ...mockIdentityRows[0], age: 53, slug: 'elon-musk' } as PersonProfile,
        { ...mockIdentityRows[1], age: 61, slug: 'jeff-bezos' } as PersonProfile,
      ];

      const result = buildComparison(people);
      expect(result.comparison.oldest).toBe('jeff-bezos');
    });

    it('calculates correct net worth total', () => {
      const people: PersonProfile[] = [
        { ...mockIdentityRows[0], net_worth: 250000000000 } as PersonProfile,
        { ...mockIdentityRows[1], net_worth: 150000000000 } as PersonProfile,
      ];

      const result = buildComparison(people);
      expect(result.comparison.net_worth_total).toBe(400000000000);
    });

    it('handles null net worth values', () => {
      const people: PersonProfile[] = [
        { ...mockIdentityRows[0], net_worth: null } as PersonProfile,
        { ...mockIdentityRows[1], net_worth: null } as PersonProfile,
      ];

      const result = buildComparison(people);
      expect(result.comparison.richest).toBeNull();
      expect(result.comparison.net_worth_total).toBe(0);
    });

    it('handles null height values', () => {
      const people: PersonProfile[] = [
        { ...mockIdentityRows[0], height_cm: null } as PersonProfile,
        { ...mockIdentityRows[1], height_cm: null } as PersonProfile,
      ];

      const result = buildComparison(people);
      expect(result.comparison.tallest).toBeNull();
    });

    it('handles null age values', () => {
      const people: PersonProfile[] = [
        { ...mockIdentityRows[0], age: null } as PersonProfile,
        { ...mockIdentityRows[1], age: null } as PersonProfile,
      ];

      const result = buildComparison(people);
      expect(result.comparison.oldest).toBeNull();
    });
  });
});
