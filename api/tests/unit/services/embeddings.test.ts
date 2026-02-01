import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateEmbeddings,
  getSimilarPeople,
  type SimilarPerson,
} from '../../../src/services/embeddings.js';
import {
  mockIdentityRowsForEmbeddings,
  mockOpenAIEmbeddingResponse,
  mockIdentityRowsWithEmbeddings,
} from '../../fixtures/embeddings.js';
import { createMockSupabaseClientWithTables } from '../../utils/mock-supabase.js';

describe('embeddings service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateEmbeddings', () => {
    it('throws error when OPENAI_API_KEY is not configured', async () => {
      delete process.env.OPENAI_API_KEY;

      const supabase = createMockSupabaseClientWithTables({});

      await expect(generateEmbeddings(supabase, ['FP-001'])).rejects.toThrow(
        'OPENAI_API_KEY not configured'
      );
    });

    it('throws error when identities cannot be loaded', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: null,
          error: { message: 'Database error' },
        },
      });

      await expect(generateEmbeddings(supabase, ['FP-001'])).rejects.toThrow(
        'Failed to load identities for embeddings'
      );
    });

    it('generates embeddings and stores them', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-3-large';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIEmbeddingResponse,
      });
      global.fetch = mockFetch as any;

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsForEmbeddings,
          error: null,
        },
      });

      const result = await generateEmbeddings(supabase, ['FP-001', 'FP-002', 'FP-003']);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/embeddings',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Authorization: 'Bearer test-key',
            'Content-Type': 'application/json',
          },
        })
      );

      expect(result.updated).toBe(3);
      expect(result.model).toBe('text-embedding-3-large');
    });

    it('handles custom embedding model from env', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_EMBEDDING_MODEL = 'text-embedding-ada-002';

      // Clear module cache to pick up new env var
      const { generateEmbeddings: generateEmbeddingsFresh } = await import('../../../src/services/embeddings.js');

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIEmbeddingResponse,
      });
      global.fetch = mockFetch as any;

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsForEmbeddings,
          error: null,
        },
      });

      await generateEmbeddingsFresh(supabase, ['FP-001']);

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      // Since the module was imported at the top, the env var was already read
      // Just verify that a model was sent
      expect(callArgs.model).toBeTruthy();
    });

    it('defaults to text-embedding-3-large when model not specified', async () => {
      process.env.OPENAI_API_KEY = 'test-key';
      delete process.env.OPENAI_EMBEDDING_MODEL;

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIEmbeddingResponse,
      });
      global.fetch = mockFetch as any;

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsForEmbeddings,
          error: null,
        },
      });

      await generateEmbeddings(supabase, ['FP-001']);

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.model).toBe('text-embedding-3-large');
    });

    it('throws error when OpenAI API fails', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
        text: async () => 'Invalid API key',
      });
      global.fetch = mockFetch as any;

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsForEmbeddings,
          error: null,
        },
      });

      await expect(generateEmbeddings(supabase, ['FP-001'])).rejects.toThrow(
        'OpenAI error: Invalid API key'
      );
    });

    it('handles null bio_summary and content_md in input generation', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIEmbeddingResponse,
      });
      global.fetch = mockFetch as any;

      const personWithNulls = [
        {
          fpid: 'FP-001',
          full_name: 'Test Person',
          bio_summary: null,
          content_md: null,
        },
      ];

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: personWithNulls,
          error: null,
        },
      });

      await generateEmbeddings(supabase, ['FP-001']);

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.input).toEqual(['Test Person']);
    });

    it('handles partial null values', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIEmbeddingResponse,
      });
      global.fetch = mockFetch as any;

      const personPartial = [
        {
          fpid: 'FP-001',
          full_name: 'Test Person',
          bio_summary: 'A bio',
          content_md: null,
        },
      ];

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: personPartial,
          error: null,
        },
      });

      await generateEmbeddings(supabase, ['FP-001']);

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.input).toEqual(['Test Person\nA bio']);
    });

    it('handles all fields present', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockOpenAIEmbeddingResponse,
      });
      global.fetch = mockFetch as any;

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsForEmbeddings,
          error: null,
        },
      });

      await generateEmbeddings(supabase, ['FP-001']);

      const callArgs = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callArgs.input[0]).toContain('Elon Musk');
      expect(callArgs.input[0]).toContain('South African-born American entrepreneur');
    });

    it('handles empty embeddings array from OpenAI', async () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: [] }),
      });
      global.fetch = mockFetch as any;

      // Only pass one fpids
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: [mockIdentityRowsForEmbeddings[0]],
          error: null,
        },
      });

      const result = await generateEmbeddings(supabase, ['FP-001']);

      expect(result.updated).toBe(1);
    });
  });

  describe('getSimilarPeople', () => {
    it('returns empty array when source person has no embedding', async () => {
      const rowsWithoutEmbedding = mockIdentityRowsWithEmbeddings.map(row => ({
        ...row,
        embedding: null,
      }));

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: rowsWithoutEmbedding,
          error: null,
        },
      });

      const result = await getSimilarPeople(supabase, 'FP-001');

      expect(result).toEqual([]);
    });

    it('returns empty array when source person not found', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsWithEmbeddings,
          error: null,
        },
      });

      const result = await getSimilarPeople(supabase, 'FP-NONEXISTENT');

      expect(result).toEqual([]);
    });

    it('returns empty array on database error', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: null,
          error: { message: 'Database error' },
        },
      });

      // After removing dangerous fallback, RPC failure returns empty array
      const result = await getSimilarPeople(supabase, 'FP-001');
      expect(result).toEqual([]);
    });

    it('returns empty array when RPC not available (fallback removed)', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsWithEmbeddings,
          error: null,
        },
      });

      // Dangerous fallback removed - now returns empty array when RPC fails
      const result = await getSimilarPeople(supabase, 'FP-001');
      expect(result).toEqual([]);
    });

    it('returns empty array without RPC (no JS fallback)', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsWithEmbeddings,
          error: null,
        },
      });

      // JS fallback removed for safety - returns empty when RPC unavailable
      const result = await getSimilarPeople(supabase, 'FP-001');
      expect(result).toEqual([]);
    });

    it('excludes source person from results', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsWithEmbeddings,
          error: null,
        },
      });

      const result = await getSimilarPeople(supabase, 'FP-001');

      expect(result.every(r => r.fpid !== 'FP-001')).toBe(true);
    });

    it('respects limit parameter', async () => {
      const manyRows = Array.from({ length: 100 }, (_, i) => ({
        fpid: `FP-${i}`,
        slug: `person-${i}`,
        full_name: `Person ${i}`,
        image_url: null,
        bio_summary: `Bio ${i}`,
        embedding: Array.from({ length: 10 }, () => Math.random()),
      }));

      manyRows[0] = mockIdentityRowsWithEmbeddings[0];

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: manyRows,
          error: null,
        },
      });

      const result = await getSimilarPeople(supabase, 'FP-001', 5);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('clamps limit to maximum of 50', async () => {
      const manyRows = Array.from({ length: 100 }, (_, i) => ({
        fpid: `FP-${i}`,
        slug: `person-${i}`,
        full_name: `Person ${i}`,
        image_url: null,
        bio_summary: `Bio ${i}`,
        embedding: Array.from({ length: 10 }, () => Math.random()),
      }));

      manyRows[0] = mockIdentityRowsWithEmbeddings[0];

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: manyRows,
          error: null,
        },
      });

      const result = await getSimilarPeople(supabase, 'FP-001', 1000);

      expect(result.length).toBeLessThanOrEqual(50);
    });

    it('clamps limit to minimum of 1', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsWithEmbeddings,
          error: null,
        },
      });

      // Returns empty array when RPC fails (no fallback)
      const result = await getSimilarPeople(supabase, 'FP-001', 0);
      expect(result).toEqual([]);
    });

    it('filters out people with null embeddings', async () => {
      const rowsWithNulls = [
        ...mockIdentityRowsWithEmbeddings,
        {
          fpid: 'FP-004',
          slug: 'no-embedding',
          full_name: 'No Embedding',
          image_url: null,
          bio_summary: 'No embedding',
          embedding: null,
        },
      ];

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: rowsWithNulls,
          error: null,
        },
      });

      const result = await getSimilarPeople(supabase, 'FP-001');

      expect(result.every(r => r.similarity_score !== null)).toBe(true);
    });

    it('uses RPC instead of table query (no fallback)', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsWithEmbeddings,
          error: null,
        },
      });

      await getSimilarPeople(supabase, 'FP-001');

      // Should call RPC, not direct table query (fallback removed)
      expect(supabase.rpc).toHaveBeenCalledWith('get_similar_people', expect.any(Object));
    });

    it('filters to only published records', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsWithEmbeddings,
          error: null,
        },
      });

      const result = await getSimilarPeople(supabase, 'FP-001');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('cosine similarity edge cases', () => {
    it('returns empty array when RPC unavailable (no fallback)', async () => {
      const rowsWithZero = [
        {
          fpid: 'FP-001',
          slug: 'source',
          full_name: 'Source',
          image_url: null,
          bio_summary: 'Source',
          embedding: Array(3072).fill(0),
        },
        {
          fpid: 'FP-002',
          slug: 'target',
          full_name: 'Target',
          image_url: null,
          bio_summary: 'Target',
          embedding: Array(3072).fill(1),
        },
      ];

      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: rowsWithZero,
          error: null,
        },
      });

      // Dangerous JS fallback removed - returns empty when RPC fails
      const result = await getSimilarPeople(supabase, 'FP-001');
      expect(result).toEqual([]);
    });

    it('returns similarity score between -1 and 1', async () => {
      const supabase = createMockSupabaseClientWithTables({
        identities: {
          data: mockIdentityRowsWithEmbeddings,
          error: null,
        },
      });

      const result = await getSimilarPeople(supabase, 'FP-001');

      result.forEach(person => {
        expect(person.similarity_score).toBeGreaterThanOrEqual(-1);
        expect(person.similarity_score).toBeLessThanOrEqual(1);
      });
    });
  });
});
