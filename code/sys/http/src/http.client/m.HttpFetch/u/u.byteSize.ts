import { Is, Num, Rx, Schedule, type t } from '../common.ts';

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

  try {
    // Rx bridges pre-aborted signal inputs on a microtask; latch that state before network work.
    await Schedule.micro();
    if (life.signal.aborted) return cancelled(url);
    if (!url) return { url, from: 'unknown' };

    /**
     * Probe: HEAD.
     */
    try {
      const response = await fetch(url, {
        ...PROBE_INIT,
        method: 'HEAD',
        signal: life.signal,
      });
      let bytes: number | undefined;
      try {
        if (response.ok && !life.signal.aborted) {
          bytes = toInt(response.headers.get('Content-Length'));
        }
      } finally {
        await response.body?.cancel().catch(() => undefined);
      }

      if (life.signal.aborted) return cancelled(url);
      if (bytes !== undefined) return { url, bytes, from: 'head' };
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
        const response = await fetch(url, {
          ...PROBE_INIT,
          method: 'GET',
          headers,
          signal: life.signal,
        });
        let bytes: number | undefined;

        try {
          if (response.ok && !life.signal.aborted) {
            const byRange = toInt(response.headers.get('Content-Range')?.match(/\/(\d+)\s*$/)?.[1]);
            const byLen = toInt(response.headers.get('Content-Length'));
            bytes = byRange ?? byLen;
          }
        } finally {
          await response.body?.cancel().catch(() => undefined);
        }

        if (life.signal.aborted) return cancelled(url);
        if (bytes !== undefined) return { url, bytes, from: 'range' };
      } catch {
        if (life.signal.aborted) return cancelled(url);
      }
    }

    return life.signal.aborted ? cancelled(url) : { url, from: 'unknown' };
  } finally {
    life.dispose();
  }
};

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
