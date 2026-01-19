import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getRelationshipsBySlug } from '../../../src/services/relationships.js';
import { getPersonBySlug } from '../../../src/services/identities.js';
import {
  mockRelationshipRows,
  mockRelationTypes,
  mockIdentityNodes,
} from '../../fixtures/relationships.js';
import { mockIdentityRows } from '../../fixtures/identities.js';

// Mock the identities module
vi.mock('../../../src/services/identities.js', () => ({
  getPersonBySlug: vi.fn(),
  getPeopleBySlugs: vi.fn(),
  getRelationshipCount: vi.fn(),
}));

describe('relationships service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to create a mock Supabase client for relationships tests
  const createMockSupabase = (options: {
    person?: any;
    relationships?: any[];
    relationTypes?: any[];
    nodes?: any[];
    count?: number;
    error?: boolean;
  }) => {
    const {
      person = { ...mockIdentityRows[0], age: 53, country: ['US'], occupation: [], social_links: {} },
      relationships = mockRelationshipRows,
      relationTypes = mockRelationTypes,
      nodes = mockIdentityNodes,
      count = relationships.length,
      error = false,
    } = options;

    vi.mocked(getPersonBySlug).mockResolvedValue(person as any);

    const mockRelsQuery = {
      select: vi.fn(() => mockRelsQuery),
      or: vi.fn(() => mockRelsQuery),
      in: vi.fn(() => mockRelsQuery),
      eq: vi.fn(() => mockRelsQuery),
      range: vi.fn(() => Promise.resolve({
        data: error ? null : relationships,
        error: error ? { message: 'Query failed' } : null,
        count: error ? null : relationships.length,
      })),
    };

    const mockRelTypesQuery = {
      select: vi.fn(() => Promise.resolve({
        data: relationTypes,
        error: null,
      })),
    };

    const mockIdentitiesQuery = {
      select: vi.fn(() => mockIdentitiesQuery),
      in: vi.fn(() => mockIdentitiesQuery),
      eq: vi.fn(() => Promise.resolve({
        data: nodes,
        error: null,
      })),
    };

    const mockCountQuery = {
      select: vi.fn(() => mockCountQuery),
      or: vi.fn(() => Promise.resolve({ count })),
    };

    let relationshipsCallCount = 0;
    const from = vi.fn((table: string) => {
      if (table === 'relationships') {
        if (relationshipsCallCount === 0) {
          relationshipsCallCount++;
          return mockRelsQuery;
        }
        return mockCountQuery;
      }
      if (table === 'relation_types') return mockRelTypesQuery;
      if (table === 'identities') return mockIdentitiesQuery;
      return {};
    });

    return { from, rpc: vi.fn() } as any;
  };

  describe('getRelationshipsBySlug', () => {
    it('returns null when person not found', async () => {
      vi.mocked(getPersonBySlug).mockResolvedValue(null as any);

      const supabase = {
        from: vi.fn(),
        rpc: vi.fn(),
      } as any;

      const result = await getRelationshipsBySlug(supabase, 'nonexistent', {});

      expect(result).toBeNull();
    });

    it('returns relationships with default options', async () => {
      const supabase = createMockSupabase({});
      const result = await getRelationshipsBySlug(supabase, 'elon-musk', {});

      expect(result).not.toBeNull();
      expect(result?.person.slug).toBe('elon-musk');
      expect(result?.edges).toHaveLength(3);
      expect(result?.nodes).toHaveLength(3);
      expect(result?.total).toBe(3);
    });

    it('returns null when relationships query fails', async () => {
      const supabase = createMockSupabase({ error: true });
      const result = await getRelationshipsBySlug(supabase, 'elon-musk', {});

      expect(result).toBeNull();
    });

    it('handles empty relationships array', async () => {
      const supabase = createMockSupabase({ relationships: [], nodes: [], count: 0 });
      const result = await getRelationshipsBySlug(supabase, 'elon-musk', {});

      expect(result).not.toBeNull();
      expect(result?.edges).toHaveLength(0);
      expect(result?.total).toBe(0);
    });

    it('calculates correct direction for edges', async () => {
      const mixedRelationships = [
        {
          source_fpid: 'FP-001',
          target_fpid: 'FP-002',
          relation_type: 'colleague',
          start_date: '2020-01-01',
          end_date: null,
        },
        {
          source_fpid: 'FP-002',
          target_fpid: 'FP-001',
          relation_type: 'competitor',
          start_date: '2015-01-01',
          end_date: null,
        },
      ];

      const mockPerson = {
        fpid: 'FP-001',
        ...mockIdentityRows[0],
        age: 53,
        country: ['US'],
        occupation: [],
        social_links: {},
      };

      const supabase = createMockSupabase({
        person: mockPerson,
        relationships: mixedRelationships,
        nodes: [mockPerson, mockIdentityNodes[1]],
      });

      const result = await getRelationshipsBySlug(supabase, 'elon-musk', {});

      expect(result).not.toBeNull();
      expect(result?.edges).toHaveLength(2);
      expect(result?.edges[0].direction).toBe('outgoing');
      expect(result?.edges[1].direction).toBe('incoming');
    });

    it('applies limit and offset correctly', async () => {
      const mockPerson = {
        ...mockIdentityRows[0],
        age: 53,
        country: ['US'],
        occupation: [],
        social_links: {},
      };

      vi.mocked(getPersonBySlug).mockResolvedValue(mockPerson as any);

      const mockRelsQuery = {
        select: vi.fn(() => mockRelsQuery),
        or: vi.fn(() => mockRelsQuery),
        in: vi.fn(() => mockRelsQuery),
        eq: vi.fn(() => mockRelsQuery),
        range: vi.fn((offset: number, limit: number) => {
          expect(offset).toBe(10);
          expect(limit).toBe(19);
          return Promise.resolve({
            data: [mockRelationshipRows[0]],
            error: null,
            count: 1,
          });
        }),
      };

      const mockRelTypesQuery = {
        select: vi.fn(() => Promise.resolve({
          data: mockRelationTypes,
          error: null,
        })),
      };

      const mockIdentitiesQuery = {
        select: vi.fn(() => mockIdentitiesQuery),
        in: vi.fn(() => mockIdentitiesQuery),
        eq: vi.fn(() => Promise.resolve({
          data: [mockPerson, mockIdentityNodes[1]],
          error: null,
        })),
      };

      const mockCountQuery = {
        select: vi.fn(() => mockCountQuery),
        or: vi.fn(() => Promise.resolve({ count: 15 })),
      };

      let relationshipsCallCount = 0;
      const from = vi.fn((table: string) => {
        if (table === 'relationships') {
          if (relationshipsCallCount === 0) {
            relationshipsCallCount++;
            return mockRelsQuery;
          }
          return mockCountQuery;
        }
        if (table === 'relation_types') return mockRelTypesQuery;
        if (table === 'identities') return mockIdentitiesQuery;
        return {};
      });

      const supabase = { from } as any;

      const result = await getRelationshipsBySlug(supabase, 'elon-musk', { limit: 10, offset: 10 });

      expect(result).not.toBeNull();
      expect(result?.limit).toBe(10);
      expect(result?.offset).toBe(10);
    });

    it('handles outgoing direction', async () => {
      const mockPerson = {
        fpid: 'FP-001',
        ...mockIdentityRows[0],
        age: 53,
        country: ['US'],
        occupation: [],
        social_links: {},
      };

      vi.mocked(getPersonBySlug).mockResolvedValue(mockPerson as any);

      const outgoingRels = [mockRelationshipRows[0]];

      const mockRelsQuery = {
        select: vi.fn(() => mockRelsQuery),
        eq: vi.fn((col: string) => {
          expect(col).toBe('source_fpid');
          return mockRelsQuery;
        }),
        in: vi.fn(() => mockRelsQuery),
        range: vi.fn(() => Promise.resolve({
          data: outgoingRels,
          error: null,
          count: 1,
        })),
      };

      const mockRelTypesQuery = {
        select: vi.fn(() => Promise.resolve({
          data: mockRelationTypes,
          error: null,
        })),
      };

      const mockIdentitiesQuery = {
        select: vi.fn(() => mockIdentitiesQuery),
        in: vi.fn(() => mockIdentitiesQuery),
        eq: vi.fn(() => Promise.resolve({
          data: [mockPerson, mockIdentityNodes[1]],
          error: null,
        })),
      };

      const mockCountQuery = {
        select: vi.fn(() => mockCountQuery),
        or: vi.fn(() => Promise.resolve({ count: 1 })),
      };

      let relationshipsCallCount = 0;
      const from = vi.fn((table: string) => {
        if (table === 'relationships') {
          if (relationshipsCallCount === 0) {
            relationshipsCallCount++;
            return mockRelsQuery;
          }
          return mockCountQuery;
        }
        if (table === 'relation_types') return mockRelTypesQuery;
        if (table === 'identities') return mockIdentitiesQuery;
        return {};
      });

      const supabase = { from } as any;

      const result = await getRelationshipsBySlug(supabase, 'elon-musk', { direction: 'outgoing' });

      expect(result).not.toBeNull();
      expect(result?.edges).toHaveLength(1);
      expect(result?.edges[0].direction).toBe('outgoing');
    });

    it('handles incoming direction', async () => {
      const mockPerson = {
        fpid: 'FP-001',
        ...mockIdentityRows[0],
        age: 53,
        country: ['US'],
        occupation: [],
        social_links: {},
      };

      vi.mocked(getPersonBySlug).mockResolvedValue(mockPerson as any);

      const incomingRels = [mockRelationshipRows[1]];

      const mockRelsQuery = {
        select: vi.fn(() => mockRelsQuery),
        eq: vi.fn((col: string) => {
          expect(col).toBe('target_fpid');
          return mockRelsQuery;
        }),
        in: vi.fn(() => mockRelsQuery),
        range: vi.fn(() => Promise.resolve({
          data: incomingRels,
          error: null,
          count: 1,
        })),
      };

      const mockRelTypesQuery = {
        select: vi.fn(() => Promise.resolve({
          data: mockRelationTypes,
          error: null,
        })),
      };

      const mockIdentitiesQuery = {
        select: vi.fn(() => mockIdentitiesQuery),
        in: vi.fn(() => mockIdentitiesQuery),
        eq: vi.fn(() => Promise.resolve({
          data: [mockPerson, mockIdentityNodes[1]],
          error: null,
        })),
      };

      const mockCountQuery = {
        select: vi.fn(() => mockCountQuery),
        or: vi.fn(() => Promise.resolve({ count: 1 })),
      };

      let relationshipsCallCount = 0;
      const from = vi.fn((table: string) => {
        if (table === 'relationships') {
          if (relationshipsCallCount === 0) {
            relationshipsCallCount++;
            return mockRelsQuery;
          }
          return mockCountQuery;
        }
        if (table === 'relation_types') return mockRelTypesQuery;
        if (table === 'identities') return mockIdentitiesQuery;
        return {};
      });

      const supabase = { from } as any;

      const result = await getRelationshipsBySlug(supabase, 'elon-musk', { direction: 'incoming' });

      expect(result).not.toBeNull();
      expect(result?.edges).toHaveLength(1);
      expect(result?.edges[0].direction).toBe('incoming');
    });

    it('filters by relation types', async () => {
      const mockPerson = {
        fpid: 'FP-001',
        ...mockIdentityRows[0],
        age: 53,
        country: ['US'],
        occupation: [],
        social_links: {},
      };

      vi.mocked(getPersonBySlug).mockResolvedValue(mockPerson as any);

      const mockRelsQuery = {
        select: vi.fn(() => mockRelsQuery),
        or: vi.fn(() => mockRelsQuery),
        in: vi.fn((col: string, types: string[]) => {
          expect(types).toEqual(['colleague']);
          return mockRelsQuery;
        }),
        eq: vi.fn(() => mockRelsQuery),
        range: vi.fn(() => Promise.resolve({
          data: [mockRelationshipRows[0]],
          error: null,
          count: 1,
        })),
      };

      const mockRelTypesQuery = {
        select: vi.fn(() => Promise.resolve({
          data: mockRelationTypes,
          error: null,
        })),
      };

      const mockIdentitiesQuery = {
        select: vi.fn(() => mockIdentitiesQuery),
        in: vi.fn(() => mockIdentitiesQuery),
        eq: vi.fn(() => Promise.resolve({
          data: [mockPerson, mockIdentityNodes[1]],
          error: null,
        })),
      };

      const mockCountQuery = {
        select: vi.fn(() => mockCountQuery),
        or: vi.fn(() => Promise.resolve({ count: 1 })),
      };

      let relationshipsCallCount = 0;
      const from = vi.fn((table: string) => {
        if (table === 'relationships') {
          if (relationshipsCallCount === 0) {
            relationshipsCallCount++;
            return mockRelsQuery;
          }
          return mockCountQuery;
        }
        if (table === 'relation_types') return mockRelTypesQuery;
        if (table === 'identities') return mockIdentitiesQuery;
        return {};
      });

      const supabase = { from } as any;

      const result = await getRelationshipsBySlug(supabase, 'elon-musk', { type: ['colleague'] });

      expect(result).not.toBeNull();
    });

    it('handles empty type array', async () => {
      const supabase = createMockSupabase({});
      const result = await getRelationshipsBySlug(supabase, 'elon-musk', { type: [] });

      expect(result).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('handles null dates in relationships', async () => {
      const relsWithNulls = [
        {
          source_fpid: 'FP-001',
          target_fpid: 'FP-002',
          relation_type: 'friend',
          start_date: null,
          end_date: null,
        },
      ];

      const mockPerson = {
        fpid: 'FP-001',
        ...mockIdentityRows[0],
        age: 53,
        country: ['US'],
        occupation: [],
        social_links: {},
      };

      const supabase = createMockSupabase({
        person: mockPerson,
        relationships: relsWithNulls,
        nodes: [mockPerson, mockIdentityNodes[1]],
      });

      const result = await getRelationshipsBySlug(supabase, 'elon-musk', {});

      expect(result).not.toBeNull();
      expect(result?.edges[0].start_date).toBeNull();
      expect(result?.edges[0].end_date).toBeNull();
    });

    it('uses reverse_label for incoming relationships', async () => {
      const mockPerson = {
        fpid: 'FP-001',
        ...mockIdentityRows[0],
        age: 53,
        country: ['US'],
        occupation: [],
        social_links: {},
      };

      vi.mocked(getPersonBySlug).mockResolvedValue(mockPerson as any);

      const incomingRel = [mockRelationshipRows[1]];

      const mockRelsQuery = {
        select: vi.fn(() => mockRelsQuery),
        eq: vi.fn(() => mockRelsQuery),
        in: vi.fn(() => mockRelsQuery),
        range: vi.fn(() => Promise.resolve({
          data: incomingRel,
          error: null,
          count: 1,
        })),
      };

      const mockRelTypesQuery = {
        select: vi.fn(() => Promise.resolve({
          data: mockRelationTypes,
          error: null,
        })),
      };

      const mockIdentitiesQuery = {
        select: vi.fn(() => mockIdentitiesQuery),
        in: vi.fn(() => mockIdentitiesQuery),
        eq: vi.fn(() => Promise.resolve({
          data: [mockPerson, mockIdentityNodes[1]],
          error: null,
        })),
      };

      const mockCountQuery = {
        select: vi.fn(() => mockCountQuery),
        or: vi.fn(() => Promise.resolve({ count: 1 })),
      };

      let relationshipsCallCount = 0;
      const from = vi.fn((table: string) => {
        if (table === 'relationships') {
          if (relationshipsCallCount === 0) {
            relationshipsCallCount++;
            return mockRelsQuery;
          }
          return mockCountQuery;
        }
        if (table === 'relation_types') return mockRelTypesQuery;
        if (table === 'identities') return mockIdentitiesQuery;
        return {};
      });

      const supabase = { from } as any;

      const result = await getRelationshipsBySlug(supabase, 'elon-musk', { direction: 'incoming' });

      expect(result).not.toBeNull();
      expect(result?.edges[0].label).toBe('Competed with');
    });

    it('handles missing relation type metadata', async () => {
      const relWithUnknownType = [
        {
          source_fpid: 'FP-001',
          target_fpid: 'FP-002',
          relation_type: 'unknown_type',
          start_date: null,
          end_date: null,
        },
      ];

      const mockPerson = {
        fpid: 'FP-001',
        ...mockIdentityRows[0],
        age: 53,
        country: ['US'],
        occupation: [],
        social_links: {},
      };

      const supabase = createMockSupabase({
        person: mockPerson,
        relationships: relWithUnknownType,
        nodes: [mockPerson, mockIdentityNodes[1]],
      });

      const result = await getRelationshipsBySlug(supabase, 'elon-musk', {});

      expect(result).not.toBeNull();
      expect(result?.edges[0].label).toBeNull();
    });

    it('returns empty nodes array when no nodes found', async () => {
      const supabase = createMockSupabase({ nodes: [] });
      const result = await getRelationshipsBySlug(supabase, 'elon-musk', {});

      expect(result).not.toBeNull();
      expect(result?.nodes).toEqual([]);
    });
  });
});
