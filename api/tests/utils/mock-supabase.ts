import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

interface MockSupabaseResponseOptions {
  data?: any;
  error?: any;
  count?: number | null;
}

type ChainableQueryBuilder = {
  eq: (column: string, value: any) => ChainableQueryBuilder;
  neq: (column: string, value: any) => ChainableQueryBuilder;
  gt: (column: string, value: any) => ChainableQueryBuilder;
  gte: (column: string, value: any) => ChainableQueryBuilder;
  lt: (column: string, value: any) => ChainableQueryBuilder;
  lte: (column: string, value: any) => ChainableQueryBuilder;
  like: (column: string, pattern: string) => ChainableQueryBuilder;
  ilike: (column: string, pattern: string) => ChainableQueryBuilder;
  is: (column: string, value: any) => ChainableQueryBuilder;
  not: (column: string, operator: string, value: any) => ChainableQueryBuilder;
  in: (column: string, values: any[]) => ChainableQueryBuilder;
  contains: (column: string, value: any) => ChainableQueryBuilder;
  or: (filter: string) => ChainableQueryBuilder;
  order: (column: string, options?: { ascending?: boolean; nullsFirst?: boolean }) => ChainableQueryBuilder;
  limit: (count: number) => ChainableQueryBuilder;
  range: (from: number, to: number) => ChainableQueryBuilder;
  select: (columns?: string, config?: any) => ChainableQueryBuilder;
  maybeSingle: () => Promise<{ data: any; error: any }>;
  single: () => Promise<{ data: any; error: any }>;
  then: (onfulfilled: (value: any) => any) => Promise<any>;
};

/**
 * Creates a mock query builder that chains all methods and resolves to a result
 */
export const createMockQueryBuilder = (result: MockSupabaseResponseOptions = {}) => {
  let finalResult: MockSupabaseResponseOptions = result;

  const buildChain = (): ChainableQueryBuilder => {
    const chain = new Proxy({} as ChainableQueryBuilder, {
      get(_target, prop: string) {
        if (prop === 'maybeSingle') {
          return async () => ({ data: finalResult.data ?? null, error: finalResult.error ?? null });
        }
        if (prop === 'single') {
          return async () => ({ data: finalResult.data ?? null, error: finalResult.error ?? null });
        }
        if (prop === 'then') {
          return async (onfulfilled: (value: any) => any) => {
            return onfulfilled({
              data: finalResult.data ?? null,
              error: finalResult.error ?? null,
              count: finalResult.count ?? null,
            });
          };
        }
        // Return a new chain for any other method
        return (...args: any[]) => buildChain();
      },
    });

    return chain;
  };

  return buildChain();
};

/**
 * Creates a mock Supabase client with multiple table responses
 * Using vi.fn to track calls
 */
export const createMockSupabaseClientWithTables = (
  tableResponses: Record<string, MockSupabaseResponseOptions>
) => {
  const mockFrom = vi.fn((table: string) => {
    const response = tableResponses[table];
    return createMockQueryBuilder(response || { data: null, error: null });
  });

  const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });

  return { from: mockFrom, rpc: mockRpc } as unknown as SupabaseClient;
};

/**
 * Creates a mock Supabase client with RPC support
 */
export const createMockSupabaseWithRpc = (
  rpcResponses: Record<string, { data?: any; error?: any }>,
  tableResponses?: Record<string, MockSupabaseResponseOptions>
) => {
  const mockRpc = vi.fn((fnName: string) => {
    const response = rpcResponses[fnName];
    return Promise.resolve(response || { data: null, error: null });
  });

  const mockFrom = vi.fn((table: string) => {
    const response = tableResponses?.[table];
    return createMockQueryBuilder(response || { data: null, error: null });
  });

  return { from: mockFrom, rpc: mockRpc } as unknown as SupabaseClient;
};

/**
 * Creates a tracked mock query builder that records method calls
 */
export const createTrackedMockQueryBuilder = () => {
  const calls: string[][] = [];
  let finalResult: MockSupabaseResponseOptions = { data: null, error: null };

  const buildChain = (): ChainableQueryBuilder => {
    const chain = new Proxy({} as ChainableQueryBuilder, {
      get(_target, prop: string) {
        if (prop === 'maybeSingle') {
          return async () => ({ data: finalResult.data ?? null, error: finalResult.error ?? null });
        }
        if (prop === 'single') {
          return async () => ({ data: finalResult.data ?? null, error: finalResult.error ?? null });
        }
        if (prop === 'then') {
          return async (onfulfilled: (value: any) => any) => {
            return onfulfilled({
              data: finalResult.data ?? null,
              error: finalResult.error ?? null,
              count: finalResult.count ?? null,
            });
          };
        }
        // Track the call and return a new chain
        return (...args: any[]) => {
          calls.push([prop, ...args.map(String)]);
          return buildChain();
        };
      },
    });

    return chain;
  };

  const queryBuilder = buildChain() as ChainableQueryBuilder & {
    _setResult: (result: MockSupabaseResponseOptions) => void;
    _getCalls: () => string[][];
  };

  queryBuilder._setResult = (result: MockSupabaseResponseOptions) => {
    finalResult = result;
  };

  queryBuilder._getCalls = () => calls;

  return queryBuilder;
};

/**
 * Creates a simpler mock Supabase client for basic tests
 */
export const createMockSupabaseClient = () => {
  const mockFrom = vi.fn();
  const mockRpc = vi.fn();

  return {
    from: mockFrom,
    rpc: mockRpc,
  } as unknown as SupabaseClient;
};
