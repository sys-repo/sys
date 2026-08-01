import { Is, Num, Rx, Schedule, type t } from './common.ts';
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
  const life = Rx.abortable(until);
  const httpFetch = makeFetch(life.signal);

  try {
    // Rx bridges pre-aborted signal inputs on a microtask; latch that state before network work.
    await Schedule.micro();
    if (life.signal.aborted) return cancelled(url);
    if (!url) return { url, from: 'unknown' };

    /**
     * Probe: HEAD.
     */
    try {
      const res = await httpFetch.head(url, PROBE_INIT);
      if (life.signal.aborted) return cancelled(url);

      const bytes = toInt(res.headers.get('Content-Length'));
      if (res.ok && bytes !== undefined) return { url, bytes, from: 'head' };
    } catch {
      if (life.signal.aborted) return cancelled(url);
    }

    if (life.signal.aborted) return cancelled(url);

    /**
     * Probe: Range (1-byte GET).
     */
    if (rangeAllowed(url)) {
      try {
        const headers = new Headers({ Range: 'bytes=0-0' });
        const res = await fetch(url, {
          ...PROBE_INIT,
          method: 'GET',
          headers,
          signal: life.signal,
        });
        let bytes: number | undefined;

        try {
          if (res.ok && !life.signal.aborted) {
            const byRange = toInt(res.headers.get('Content-Range')?.match(/\/(\d+)\s*$/)?.[1]);
            const byLen = toInt(res.headers.get('Content-Length'));
            bytes = byRange ?? byLen;
          }
        } finally {
          await res.body?.cancel().catch(() => undefined);
        }

        if (life.signal.aborted) return cancelled(url);
        if (bytes !== undefined) return { url, bytes, from: 'range' };
      } catch {
        if (life.signal.aborted) return cancelled(url);
      }
    }

    return life.signal.aborted ? cancelled(url) : { url, from: 'unknown' };
  } finally {
    httpFetch.dispose();
    life.dispose();
  }
};

/**
 * Helpers:
 */
const cancelled = (url: t.StringUrl): t.HttpFetch.ByteSize.Result => ({
  url,
  from: 'unknown',
  cancelled: true,
});

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
