import { type t } from './common.ts';
import { makeFetch } from './m.Fetch.make.ts';
import { isFetch } from './u.is.ts';

/**
 * Probe `Content-Length`/`Content-Range` headers
 * to discover total byte size.
 */
export const byteSize: t.HttpFetchLib['byteSize'] = async (...args: any[]) => {
  const { url, httpFetch } = wrangle.args(args);
  if (!url) return { url, from: 'unknown' };

  /**
   * Probe: HEAD.
   */
  try {
    const res = await httpFetch.head(url);
    const bytes = toInt(res.headers.get('Content-Length'));
    if (bytes !== undefined) return { url, bytes, from: 'head' };
  } catch {
    /* Ignore. */
  }

  /**
   * Probe: Range (1-byte GET).
   */
  const isServer = !globalThis.location;
  const isSameOriginUrl =
    typeof globalThis !== 'undefined' &&
    new URL(url, globalThis.location?.href).origin === globalThis.location?.origin;

  if (isServer || isSameOriginUrl) {
    try {
      // We only need headers, so use a raw fetch to avoid reading the body.
      const res = await fetch(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        // Abort when the caller’s HttpFetch is disposed (if available):
        signal: (httpFetch as any)?.signal ?? undefined,
      });

      // Stop reading as soon as headers arrive.
      res.body?.cancel?.();

      if (res.ok) {
        const byRange = toInt(res.headers.get('Content-Range')?.match(/\/(\d+)\s*$/)?.[1]);
        const byLen = toInt(res.headers.get('Content-Length'));
        const bytes = byRange ?? byLen;
        if (bytes !== undefined) return { url, bytes, from: 'range' };
      }
    } catch {
      /* ignore */
    }
  }

  // Finish up.
  return { url, from: 'unknown' };
};

/**
 * Helpers:
 */
const toInt = (v?: string | null) => (v && /^\d+$/.test(v) ? parseInt(v, 10) : undefined);
const wrangle = {
  args(args: any[]) {
    const url = args[0] as string;
    const httpFetch = isFetch(args[1]) ? args[1] : makeFetch(args[1]);
    return { url, httpFetch } as const;
  },
} as const;
