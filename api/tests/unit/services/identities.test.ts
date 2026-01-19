import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getPersonBySlug,
  getPeopleBySlugs,
  getRelationshipCount,
  type PersonProfile,
} from '../../../src/services/identities.js';
import { mockIdentityRows, mockUnpublishedPerson } from '../../fixtures/identities.js';
import { createMockSupabaseClientWithTables, createTrackedMockQueryBuilder } from '../../utils/mock-supabase.js';

describe('identities service', () => {
  describe('getPersonBySlug', () => {
    it('returns a person profile when found and published', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRows[0],
          error: null,
        },
      });

      const result = await getPersonBySlug(supabase, 'elon-musk');

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('elon-musk');
      expect(result?.full_name).toBe('Elon Musk');
      expect(result?.age).toBeGreaterThan(50);
      expect(result?.country).toEqual(['US', 'ZA', 'CA']);
      expect(result?.occupation).toEqual(['Entrepreneur', 'Engineer']);
      expect(result?.social_links).toEqual({ twitter: 'elonmusk' });
    });

    it('returns null when person not found', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: null,
          error: { message: 'Not found' },
        },
      });

      const result = await getPersonBySlug(supabase, 'nonexistent');

      expect(result).toBeNull();
    });

    it('returns null when person is unpublished and includeUnpublished is false', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: null,
          error: { message: 'Not found' },
        },
      });

      const result = await getPersonBySlug(supabase, 'unpublished-person', false);

      expect(result).toBeNull();
    });

    it('returns unpublished person when includeUnpublished is true', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockUnpublishedPerson,
          error: null,
        },
      });

      const result = await getPersonBySlug(supabase, 'unpublished-person', true);

      expect(result).not.toBeNull();
      expect(result?.slug).toBe('unpublished-person');
    });

    it('calculates age correctly for living person', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: {
            ...mockIdentityRows[0],
            birth_date: '1990-05-15',
            death_date: null,
          },
          error: null,
        },
      });

      const result = await getPersonBySlug(supabase, 'person-born-1990');

      expect(result).not.toBeNull();
      expect(result?.age).toBeGreaterThan(30);
    });

    it('calculates age correctly for deceased person', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRows[2],
          error: null,
        },
      });

      const result = await getPersonBySlug(supabase, 'albert-einstein');

      expect(result).not.toBeNull();
      expect(result?.age).toBe(76);
    });

    it('returns null age when birth_date is null', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: {
            ...mockIdentityRows[0],
            birth_date: null,
            death_date: null,
          },
          error: null,
        },
      });

      const result = await getPersonBySlug(supabase, 'unknown-birth');

      expect(result).not.toBeNull();
      expect(result?.age).toBeNull();
    });

    it('handles empty country array', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: {
            ...mockIdentityRows[0],
            country: null,
          },
          error: null,
        },
      });

      const result = await getPersonBySlug(supabase, 'no-country');

      expect(result).not.toBeNull();
      expect(result?.country).toEqual([]);
    });

    it('handles empty occupation array', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: {
            ...mockIdentityRows[0],
            occupation: null,
          },
          error: null,
        },
      });

      const result = await getPersonBySlug(supabase, 'no-occupation');

      expect(result).not.toBeNull();
      expect(result?.occupation).toEqual([]);
    });

    it('handles null social_links', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: {
            ...mockIdentityRows[0],
            social_links: null,
          },
          error: null,
        },
      });

      const result = await getPersonBySlug(supabase, 'no-social');

      expect(result).not.toBeNull();
      expect(result?.social_links).toEqual({});
    });
  });

  describe('getPeopleBySlugs', () => {
    it('returns people for valid slugs', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: [mockIdentityRows[0], mockIdentityRows[1]],
          error: null,
        },
      });

      const result = await getPeopleBySlugs(supabase, ['elon-musk', 'jeff-bezos']);

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('elon-musk');
      expect(result[1].slug).toBe('jeff-bezos');
    });

    it('returns empty array for empty slugs input', async () => {
      const supabase = createMockSupabaseClientWithTables({});

      const result = await getPeopleBySlugs(supabase, []);

      expect(result).toEqual([]);
    });

    it('filters out unpublished people when includeUnpublished is false', async () => {
      // The mock returns both but the actual service would filter via the query
      // Our mock doesn't implement filter logic, so we mock the filtered result
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: [mockIdentityRows[0]], // Only published person
          error: null,
        },
      });

      const result = await getPeopleBySlugs(supabase, ['elon-musk', 'unpublished-person'], false);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('elon-musk');
    });

    it('includes unpublished people when includeUnpublished is true', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: [mockIdentityRows[0], mockUnpublishedPerson],
          error: null,
        },
      });

      const result = await getPeopleBySlugs(supabase, ['elon-musk', 'unpublished-person'], true);

      expect(result).toHaveLength(2);
    });

    it('maintains slug order from input', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: [
            mockIdentityRows[2],
            mockIdentityRows[0],
            mockIdentityRows[1],
          ],
          error: null,
        },
      });

      const result = await getPeopleBySlugs(supabase, ['elon-musk', 'albert-einstein', 'jeff-bezos']);

      expect(result).toHaveLength(3);
      expect(result[0].slug).toBe('elon-musk');
      expect(result[1].slug).toBe('albert-einstein');
      expect(result[2].slug).toBe('jeff-bezos');
    });

    it('returns empty array when error occurs', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: null,
          error: { message: 'Database error' },
        },
      });

      const result = await getPeopleBySlugs(supabase, ['elon-musk']);

      expect(result).toEqual([]);
    });

    it('handles null values in array fields', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: [
            {
              ...mockIdentityRows[0],
              country: null,
              occupation: null,
              social_links: null,
            },
          ],
          error: null,
        },
      });

      const result = await getPeopleBySlugs(supabase, ['elon-musk']);

      expect(result).toHaveLength(1);
      expect(result[0].country).toEqual([]);
      expect(result[0].occupation).toEqual([]);
      expect(result[0].social_links).toEqual({});
    });
  });

  describe('getRelationshipCount', () => {
    it('returns count when relationships exist', async () => {
      const supabase = createMockSupabaseClientWithTables({
        relationships: {
          data: null,
          error: null,
          count: 10,
        },
      });

      const result = await getRelationshipCount(supabase, 'FP-001');

      expect(result).toBe(10);
    });

    it('returns 0 when no relationships exist', async () => {
      const supabase = createMockSupabaseClientWithTables({
        relationships: {
          data: null,
          error: null,
          count: 0,
        },
      });

      const result = await getRelationshipCount(supabase, 'FP-999');

      expect(result).toBe(0);
    });

    it('returns 0 when count is null', async () => {
      const supabase = createMockSupabaseClientWithTables({
        relationships: {
          data: null,
          error: null,
          count: null,
        },
      });

      const result = await getRelationshipCount(supabase, 'FP-001');

      expect(result).toBe(0);
    });

    it('handles database error gracefully', async () => {
      const supabase = createMockSupabaseClientWithTables({
        relationships: {
          data: null,
          error: { message: 'Database error' },
          count: null,
        },
      });

      const result = await getRelationshipCount(supabase, 'FP-001');

      expect(result).toBe(0);
    });
  });
});
