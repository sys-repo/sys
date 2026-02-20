import type { t } from '../common.ts';

export type HttpFixtureResponse = {
  readonly status?: number;
  readonly statusText?: string;
};

export function jsonResponse(body: unknown, options: HttpFixtureResponse = {}) {
  return new Response(JSON.stringify(body), {
    status: options.status ?? 200,
    statusText: options.statusText ?? 'OK',
    headers: { 'content-type': 'application/json' },
  });
}

export function stubFetch(handler: (url: string, init?: RequestInit) => Response) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return handler(url, init);
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}

export function makeDist(parts: string[]): t.DistPkg {
  const hashParts: Record<string, t.StringFileHashUri> = {};
  for (const part of parts) {
    hashParts[part] = 'sha256-abc:bytes-0';
  }
  return {
    type: 'https://example.com/src/types/t.Pkg.dist.ts',
    pkg: { name: 'slug-client', version: '0.0.1' },
    build: {
      time: 0 as t.UnixTimestamp,
      size: { total: 0, pkg: 0 },
      builder: 'foobar@0.0.1',
      runtime: 'deno=1:v8=1:typescript=5',
      hash: { policy: 'https://jsr.io/@sys/fs/0.0.225/src/m.Pkg/m.Pkg.Dist.ts' },
    },
    hash: { digest: 'sha256-def', parts: hashParts as t.CompositeHashParts },
  };
}
