import { type t, Time } from './common.ts';

/**
 * Convenience: boolean probe with default options.
 * Returns true if reachable within the timeout, false otherwise.
 */
export const isAlive: t.HttpClientLib['isAlive'] = async (url, opts = {}) => {
  try {
    await waitFor(url, opts);
    return true;
  } catch {
    return false;
  }
};

/**
 * Default readiness predicate:
 * - Any 2xx
 * - Any 3xx
 * - 404 (route not found but server is serving)
 */
export function defaultHttpReady(res: Response): boolean {
  return res.ok || res.status === 404 || (res.status >= 200 && res.status < 400);
}

/**
 * Poll an HTTP endpoint until it responds per the readiness predicate.
 * Throws on timeout. On success, resolves with simple timing metadata.
 */
export const waitFor: t.HttpClientLib['waitFor'] = async (url, opts = {}) => {
  const { timeout = 30_000, interval = 150 } = opts;
  const reqTimeout = opts.requestTimeout ?? Math.max(2000, interval * 2);
  const method = opts.method ?? 'HEAD';
  const headers = opts.headers ?? {};
  const redirect = opts.redirect ?? 'manual';
  const predicate = opts.predicate ?? defaultHttpReady;

  let attempts = 0;
  let lastStatus: number | undefined;
  const started = Date.now();

  async function attempt(): Promise<t.HttpWaitResult | undefined> {
    try {
      const r = await attemptOnce({ url, method, headers, redirect, reqTimeout, predicate });
      lastStatus = r.status;
      if (r.ok) return { url, attempts, elapsed: Date.now() - started, lastStatus };
    } catch {
      // Swallow transient connect/errors and keep polling until timeout.
      // (eg. ECONNREFUSED before the server binds)
    }
  }

  while (Date.now() - started < timeout) {
    attempts += 1;
    const result = await attempt();
    if (result) return result;
    await Time.wait(interval);
  }

  throw new Error(wrangle.timeoutError(url, started, attempts, lastStatus));
};

/**
 * Internal: perform a single probe attempt (HEAD, optional fallback to GET).
 */
type AttemptArgs = {
  url: string;
  method: 'HEAD' | 'GET';
  headers: Readonly<Record<string, string>>;
  redirect: RequestRedirect;
  reqTimeout: t.Msecs;
  predicate: (res: Response) => boolean;
};

async function attemptOnce(args: AttemptArgs): Promise<{ ok: boolean; status?: number }> {
  const { url, method, headers, redirect, reqTimeout, predicate } = args;

  // HEAD (or GET if requested):
  const res = await fetchWithTimeout({ url, method, headers, redirect, reqTimeout });
  let status = res.status;

  if (predicate(res)) {
    await closeBody(res);
    return { ok: true, status };
  }

  await closeBody(res);

  // Fallback HEAD → GET if needed:
  if (method === 'HEAD') {
    const res2 = await fetchWithTimeout({ url, method: 'GET', headers, redirect, reqTimeout });
    status = res2.status;
    const ok = predicate(res2);
    await closeBody(res2);
    return { ok, status };
  }

  return { ok: false, status };
}

/**
 * Internal: fetch with per-request timeout (always clears timers).
 */
type FetchArgs = {
  url: string;
  method: 'HEAD' | 'GET';
  headers: Readonly<Record<string, string>>;
  redirect: RequestRedirect;
  reqTimeout: t.Msecs;
};

async function fetchWithTimeout(a: FetchArgs): Promise<Response> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), a.reqTimeout);
  try {
    return await fetch(a.url, {
      method: a.method,
      headers: a.headers,
      redirect: a.redirect,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(to);
  }
}

/** Close response body stream if present and not already consumed. */
const closeBody = async (res: Response) => {
  try {
    if (res.body && !res.body.locked) await res.body.cancel();
  } catch {
    /* ignore */
  }
};

/**
 * Helpers:
 */
const wrangle = {
  timeoutError(url: string, started: t.UnixEpoch, attempts: number, lastStatus?: t.HttpStatusCode) {
    const elapsed = Date.now() - started;
    const parts = [`Timed out waiting for ${url}`, `after ${elapsed}ms`, `attempts=${attempts}`];
    if (lastStatus !== undefined) parts.push(`lastStatus=${lastStatus}`);
    return parts.join(' ');
  },
} as const;
