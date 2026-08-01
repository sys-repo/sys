import { Is, Num, type t } from './common.ts';
import { makeFetch } from './m.Fetch.make.ts';

const PROBE_INIT: RequestInit = {
  credentials: 'omit',
  redirect: 'manual',
  referrerPolicy: 'no-referrer',
};

/**
 * Probe `Content-Length`/`Content-Range` headers
 * to discover total byte size.
 */
export const byteSize: t.HttpFetch.ByteSize.Method = async (url, until) => {
  const httpFetch = makeFetch(until);

  try {
    if (!url) return { url, from: 'unknown' };

    /**
     * Probe: HEAD.
     */
    try {
      const res = await httpFetch.head(url, PROBE_INIT);
      const bytes = toInt(res.headers.get('Content-Length'));
      if (res.ok && bytes !== undefined) return { url, bytes, from: 'head' };
    } catch {
      /* Ignore. */
    }

    /**
     * Probe: Range (1-byte GET).
     */
    if (rangeAllowed(url)) {
      try {
        const headers = new Headers({ Range: 'bytes=0-0' });
        const res = await fetch(url, { ...PROBE_INIT, method: 'GET', headers });

        try {
          if (res.ok) {
            const byRange = toInt(res.headers.get('Content-Range')?.match(/\/(\d+)\s*$/)?.[1]);
            const byLen = toInt(res.headers.get('Content-Length'));
            const bytes = byRange ?? byLen;
            if (bytes !== undefined) return { url, bytes, from: 'range' };
          }
        } finally {
          await res.body?.cancel().catch(() => undefined);
        }
      } catch {
        /* Ignore. */
      }
    }

    return { url, from: 'unknown' };
  } finally {
    httpFetch.dispose();
  }
};

/**
 * Helpers:
 */
const toInt = (value?: string | null) => {
  if (!Is.str(value) || !/^\d+$/.test(value)) return undefined;
  const number = Number(value);
  return Num.Is.safeInt(number) ? number : undefined;
};

const rangeAllowed = (url: t.StringUrl) => {
  if (!Is.browser()) return true;
  if (!globalThis.location) return false;

  try {
    return new URL(url, globalThis.location.href).origin === globalThis.location.origin;
  } catch {
    return false;
  }
};
