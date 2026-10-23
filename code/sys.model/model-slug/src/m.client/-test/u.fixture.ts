import type { t } from '../common.ts';

const SOURCE_ORIGINS = [
  'http://example.com',
  'http://base.example.com',
  'http://content.example.com',
  'http://manifests.example.com',
  'http://manifests-a.example.com',
  'http://manifests-b.example.com',
  'http://localhost:4040',
] as const;

/** Explicit bounded transport authority shared by endpoint-loader tests. */
export const LOAD_OPTIONS: t.SlugLoadOptions = {
  policy: {
    maxBytes: 64 * 1024 * 1024,
    timeout: 1000,
    maxRedirects: 0,
    progressInterval: 25,
    sourceOrigins: SOURCE_ORIGINS,
    credentialOrigins: SOURCE_ORIGINS,
  },
};

export type HttpFixtureResponse = {
  readonly status?: number;
  readonly statusText?: string;
};

export function jsonResponse(body: unknown, options: HttpFixtureResponse = {}): Response {
  return new Response(JSON.stringify(body), {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: { 'content-type': 'application/json' },
  });
}

export function textResponse(text: string, options: HttpFixtureResponse = {}) {
  return new Response(text, {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
  });
}

export function stubFetch(handler: (url: string, init?: RequestInit) => Response) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return Promise.resolve(handler(url, init));
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}
