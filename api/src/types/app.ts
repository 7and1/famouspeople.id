export type AppEnv = {
  Variables: {
    requestId: string;
    auth?: unknown;
  };
};

// Cloudflare Workers type declarations for edge runtime
declare global {
  interface KVNamespace {
    get(key: string, type?: 'text' | 'arrayBuffer' | 'stream'): Promise<string | ArrayBuffer | ReadableStream | null>;
    put(key: string, value: string | ArrayBuffer | ReadableStream, options?: { expirationTtl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
    list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{ keys: Array<{ name: string }>; list_complete: boolean; cursor?: string }>;
  }

  interface ExecutionContext {
    waitUntil(promise: Promise<unknown>): void;
    passThroughOnException(): void;
  }
}

export {};
