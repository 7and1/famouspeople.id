import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchPeople, normalizeSearchParams, type SearchParams } from '../../../src/services/search.js';
import { mockSearchResults, mockSearchFacets } from '../../fixtures/search.js';

describe('search service', () => {
  describe('normalizeSearchParams', () => {
    it('applies default values', () => {
      const result = normalizeSearchParams({ q: 'test' });

      expect(result.q).toBe('test');
      expect(result.type).toBe('Person');
      expect(result.sort).toBe('relevance');
      expect(result.limit).toBe(20);
      expect(result.offset).toBe(0);
    });

    it('trims query string', () => {
      const result = normalizeSearchParams({ q: '  elon musk  ' });

      expect(result.q).toBe('elon musk');
    });

    it('preserves provided values', () => {
      const params: SearchParams = {
        q: 'test',
        type: 'Character',
        country: 'US',
        occupation: 'Actor',
        zodiac: 'Leo',
        mbti: 'ENFP',
        gender: 'Female',
        birth_year_min: 1980,
        birth_year_max: 2000,
        net_worth_min: 1000000,
        is_alive: true,
        sort: 'net_worth:desc',
        limit: 50,
        offset: 100,
      };

      const result = normalizeSearchParams(params);

      expect(result.type).toBe('Character');
      expect(result.country).toBe('US');
      expect(result.occupation).toBe('Actor');
      expect(result.zodiac).toBe('Leo');
      expect(result.mbti).toBe('ENFP');
      expect(result.gender).toBe('Female');
      expect(result.birth_year_min).toBe(1980);
      expect(result.birth_year_max).toBe(2000);
      expect(result.net_worth_min).toBe(1000000);
      expect(result.is_alive).toBe(true);
      expect(result.sort).toBe('net_worth:desc');
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(100);
    });

    it('handles limit of 0', () => {
      const result = normalizeSearchParams({ q: 'test', limit: 0 });

      expect(result.limit).toBe(0);
    });

    it('handles undefined optional parameters', () => {
      const result = normalizeSearchParams({
        q: 'test',
        type: undefined,
        sort: undefined,
      });

      expect(result.type).toBe('Person');
      expect(result.sort).toBe('relevance');
    });
  });

  describe('searchPeople', () => {
    let mockFetch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      mockFetch = vi.fn();
      global.fetch = mockFetch;
    });

    it('returns search results using RPC when available', async () => {
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({ data: mockSearchResults, error: null })
        .mockResolvedValueOnce({ data: 100, error: null })
        .mockResolvedValueOnce({ data: mockSearchFacets, error: null });

      const supabase = { rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'elon', limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.data[0].fpid).toBe('FP-001');
      expect(result.meta.total).toBe(100);
      expect(result.meta.page).toBe(1);
      expect(result.meta.per_page).toBe(10);
      expect(result.meta.has_next).toBe(true);
      expect(result.meta.facets).toEqual(mockSearchFacets);
    });

    it('normalizes arrays in results', async () => {
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({ data: mockSearchResults, error: null })
        .mockResolvedValueOnce({ data: 100, error: null })
        .mockResolvedValueOnce({ data: mockSearchFacets, error: null });

      const supabase = { rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'test' });

      expect(result.data[0].occupation).toEqual(['Entrepreneur', 'Engineer']);
      expect(result.data[0].country).toEqual(['US', 'ZA']);
    });

    it('handles null relevance_score', async () => {
      const resultsWithoutScore = mockSearchResults.map(r => ({ ...r, relevance_score: null }));
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({ data: resultsWithoutScore, error: null })
        .mockResolvedValueOnce({ data: 2, error: null })
        .mockResolvedValueOnce({ data: mockSearchFacets, error: null });

      const supabase = { rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'test' });

      expect(result.data[0].relevance_score).toBeNull();
    });

    it('falls back to ilike search when RPC fails', async () => {
      // Create a self-referencing chain builder
      const createChain = () => {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          ilike: () => chain,
          order: () => chain,
          range: () => Promise.resolve({ data: mockSearchResults, count: 2, error: null }),
        };
        return chain;
      };

      const mockFrom = vi.fn(() => createChain());
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      const supabase = { from: mockFrom, rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'elon', limit: 10 });

      expect(result.data).toHaveLength(3);
      expect(result.meta.total).toBe(2);
      expect(result.meta.facets.country).toEqual([]);
    });

    it('applies net_worth sort fallback', async () => {
      const createChain = () => {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          ilike: () => chain,
          order: () => chain,
          range: () => Promise.resolve({ data: mockSearchResults, count: 2, error: null }),
        };
        return chain;
      };

      const mockFrom = vi.fn(() => createChain());
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      const supabase = { from: mockFrom, rpc: mockRpc } as any;

      await searchPeople(supabase, { q: 'test', sort: 'net_worth:desc' });

      expect(mockFrom).toHaveBeenCalled();
    });

    it('applies birth_date sort fallback', async () => {
      const createChain = () => {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          ilike: () => chain,
          order: () => chain,
          range: () => Promise.resolve({ data: mockSearchResults, count: 2, error: null }),
        };
        return chain;
      };

      const mockFrom = vi.fn(() => createChain());
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      const supabase = { from: mockFrom, rpc: mockRpc } as any;

      await searchPeople(supabase, { q: 'test', sort: 'birth_date:asc' });

      expect(mockFrom).toHaveBeenCalled();
    });

    it('applies name sort fallback', async () => {
      const createChain = () => {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          ilike: () => chain,
          order: () => chain,
          range: () => Promise.resolve({ data: mockSearchResults, count: 2, error: null }),
        };
        return chain;
      };

      const mockFrom = vi.fn(() => createChain());
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      const supabase = { from: mockFrom, rpc: mockRpc } as any;

      await searchPeople(supabase, { q: 'test', sort: 'name:asc' });

      expect(mockFrom).toHaveBeenCalled();
    });

    it('calculates pagination correctly', async () => {
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({ data: mockSearchResults.slice(0, 10), error: null })
        .mockResolvedValueOnce({ data: 100, error: null })
        .mockResolvedValueOnce({ data: mockSearchFacets, error: null });

      const supabase = { rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'test', limit: 10, offset: 20 });

      expect(result.meta.page).toBe(3);
      expect(result.meta.per_page).toBe(10);
      expect(result.meta.has_next).toBe(true);
    });

    it('calculates has_next correctly for last page', async () => {
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({ data: mockSearchResults.slice(0, 5), error: null })
        .mockResolvedValueOnce({ data: 25, error: null })
        .mockResolvedValueOnce({ data: mockSearchFacets, error: null });

      const supabase = { rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'test', limit: 10, offset: 20 });

      expect(result.meta.has_next).toBe(false);
    });

    it('handles empty results', async () => {
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: 0, error: null })
        .mockResolvedValueOnce({ data: { country: [], zodiac: [] }, error: null });

      const supabase = { rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'nonexistent' });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('handles RPC error gracefully for count', async () => {
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({ data: mockSearchResults, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Count failed' } })
        .mockResolvedValueOnce({ data: mockSearchFacets, error: null });

      const supabase = { rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'test' });

      expect(result.meta.total).toBe(0);
    });

    it('handles RPC error gracefully for facets', async () => {
      const mockRpc = vi.fn()
        .mockResolvedValueOnce({ data: mockSearchResults, error: null })
        .mockResolvedValueOnce({ data: 100, error: null })
        .mockResolvedValueOnce({ data: null, error: { message: 'Facets failed' } });

      const supabase = { rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'test' });

      expect(result.meta.facets.country).toEqual([]);
      expect(result.meta.facets.zodiac).toEqual([]);
    });

    it('handles null data in fallback search', async () => {
      const createChain = () => {
        const chain: any = {
          select: () => chain,
          eq: () => chain,
          ilike: () => chain,
          order: () => chain,
          range: () => Promise.resolve({ data: null, count: 0, error: null }),
        };
        return chain;
      };

      const mockFrom = vi.fn(() => createChain());
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } });

      const supabase = { from: mockFrom, rpc: mockRpc } as any;

      const result = await searchPeople(supabase, { q: 'test' });

      expect(result.data).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('handles special characters in query', async () => {
      const result = normalizeSearchParams({ q: "test O'Reilly" });

      expect(result.q).toBe("test O'Reilly");
    });

    it('handles unicode in query', async () => {
      const result = normalizeSearchParams({ q: 'Müller François' });

      expect(result.q).toBe('Müller François');
    });

    it('handles very large limit values', async () => {
      const result = normalizeSearchParams({ q: 'test', limit: 999999 });

      expect(result.limit).toBe(999999);
    });

    it('handles very large offset values', async () => {
      const result = normalizeSearchParams({ q: 'test', offset: 999999 });

      expect(result.offset).toBe(999999);
    });
  });
});
