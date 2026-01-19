import { vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

// Mock pg module to avoid native module loading issues in tests
vi.mock('pg', () => ({
  default: class MockPool {
    constructor() {}
    connect() {
      return Promise.resolve({
        query: () => Promise.resolve({ rows: [] }),
        release: () => {},
      });
    }
    end() {
      return Promise.resolve();
    }
    on() {
      return this;
    }
  },
  Pool: class MockPool {
    constructor() {}
    connect() {
      return Promise.resolve({
        query: () => Promise.resolve({ rows: [] }),
        release: () => {},
      });
    }
    end() {
      return Promise.resolve();
    }
    on() {
      return this;
    }
  },
}));

// Mock Redis module from Upstash
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    constructor() {}
    get() {
      return Promise.resolve(null);
    }
    set() {
      return Promise.resolve('OK');
    }
    del() {
      return Promise.resolve(1);
    }
    incr() {
      return Promise.resolve(1);
    }
    expire() {
      return Promise.resolve(1);
    }
  },
}));

// Mock Upstash ratelimit
vi.mock('@upstash/ratelimit', () => ({
  Ratelimit: class MockRatelimit {
    constructor() {}
    static slidingWindow() {
      return {};
    }
    limit() {
      return Promise.resolve({
        success: true,
        limit: 60,
        remaining: 59,
        reset: Date.now() + 60000,
      });
    }
  },
}));

// Mock Supabase client creation
const createChainableMock = () => {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    then: vi.fn().mockResolvedValue({ data: null, error: null, count: null }),
  };

  return new Proxy(chain, {
    get(target, prop) {
      if (prop in target) {
        return target[prop];
      }
      return vi.fn().mockReturnThis();
    },
  });
};

const mockSupabaseClient: SupabaseClient = {
  from: vi.fn(() => createChainableMock()),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  single: vi.fn().mockResolvedValue({ data: null, error: null }),
  contains: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  not: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
} as unknown as SupabaseClient;

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Set environment variables for tests
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
