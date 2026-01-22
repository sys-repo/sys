import { describe, expect, it } from '../../-test.ts';
import { SlugClient, SlugUrl } from '../mod.ts';
import type { t } from '../common.ts';
import type { SpecTimelineAssetsManifest, SpecTimelineManifest, SpecTimelineAsset } from '../t.ts';

type HttpFixtureResponse = { status?: number; statusText?: string };

export function jsonResponse(body: unknown, options: HttpFixtureResponse = {}) {
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

export function stubFetch(handler: (url: string) => Response) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    return handler(url);
  };
  return () => {
    globalThis.fetch = originalFetch;
  };
}
