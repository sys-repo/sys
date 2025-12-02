import { type t, Fs, HttpClient, Path, Time, Url } from './common.ts';
import { isAbortError, resolveTarget } from './u.ts';

type FetchResponse =
  | { ok: true; bytes: Uint8Array; status: number }
  | { ok: false; status?: number; error: string };

type NormalizedRetry =
  | { enabled: false }
  | { enabled: true; attempts: number; base: t.Msecs; factor: number; jitter: boolean };

export async function pullOne(
  url: t.StringUrl,
  dir: t.StringDir,
  client: t.HttpFetch,
  opts: {
    map?: t.HttpPullMapOptions;
    signal?: AbortSignal;
    retry?: t.HttpPullOptions['retry'];
  },
): Promise<t.HttpPullRecord> {
  const { map, signal } = opts;
  const retryOpts = normalizeRetry(opts.retry);

  async function attemptFetch(u: URL): Promise<FetchResponse> {
    let res: any;

    try {
      res = await (client as any).blob(u.toString(), { signal });
    } catch (err) {
      // Deno fetcher throws on certain HTTP errors, including 503.
      // Convert thrown errors into a retry-eligible {ok:false,status}.
      const msg = err instanceof Error ? err.message : String(err);
      const match = msg.match(/(\d{3})/);
      const code = match ? Number(match[1]) : undefined;
      return { ok: false, status: code, error: msg };
    }

    // If status is 5xx, treat it as retry-eligible even if data is missing.
    // Previously this returned a fatal error too early.
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error: res.error?.message ?? (res.status ? `HTTP ${res.status}` : 'Network error'),
      };
    }
    if (!res.data) {
      const is5xx = res.status >= 500 && res.status <= 599;
      return {
        ok: false,
        status: res.status,
        error: is5xx ? `HTTP ${res.status}` : 'Network error',
      };
    }

    const bytes = await HttpClient.toUint8Array(res.data);
    return { ok: true, status: res.status, bytes };
  }

  /**
   * Retry wrapper (5xx only).
   */
  async function fetchWithRetry(u: URL): Promise<FetchResponse> {
    if (!retryOpts.enabled) {
      return attemptFetch(u);
    }

    const { attempts, base, factor, jitter } = retryOpts;

    for (let attempt = 0; attempt < attempts; attempt++) {
      try {
        const result = await attemptFetch(u);
        if (result.ok) return result;

        const is5xx = result.status && result.status >= 500 && result.status <= 599;
        const last = attempt === attempts - 1;
        if (!is5xx || last) return result;

        const raw = base * Math.pow(factor, attempt);
        const ms = jitter ? raw + Math.floor(Math.random() * raw * 0.3) : raw;

        await Time.wait(ms as t.Msecs, { signal });
      } catch (err) {
        if (isAbortError(err)) throw err;

        const msg = err instanceof Error ? err.message : String(err);
        const looks5xx = msg.includes('5');
        const last = attempt === attempts - 1;

        if (!looks5xx || last) {
          return { ok: false, error: msg };
        }

        const raw = base * Math.pow(factor, attempt);
        const ms = jitter ? raw + Math.floor(Math.random() * raw * 0.3) : raw;

        await Time.wait(ms as t.Msecs, { signal });
      }
    }

    return { ok: false, error: 'Unknown pull error' };
  }

  /** -------------------------------------------------------
   * Main body
   */
  const target = resolveTarget(url, dir, map);
  const u = Url.parse(url);

  if (!u.ok) {
    return { ok: false, error: 'Invalid URL', path: { source: url, target } };
  }

  try {
    await Fs.ensureDir(Path.dirname(target) as t.StringDir);

    const result = await fetchWithRetry(u.toURL());
    if (!result.ok) {
      return {
        ok: false,
        status: result.status as t.HttpStatusCode | undefined,
        error: result.error,
        path: { source: url, target },
      };
    }

    await Fs.write(target, result.bytes, { force: true });

    return {
      ok: true,
      status: result.status as t.HttpStatusCode,
      bytes: result.bytes.byteLength as t.NumberBytes,
      path: { source: url, target },
    };
  } catch (err) {
    if (isAbortError(err)) throw err;
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      path: { source: url, target },
    };
  }
}

/**
 * Pure retry normalizer.
 * Ensures:
 *   - enabled: false  → no retries
 *   - enabled: true   → all fields fully defined (no undefined)
 */
function normalizeRetry(retry: t.HttpPullOptions['retry']): NormalizedRetry {
  // - retry === false      → disabled
  // - retry === undefined  → enabled with defaults
  // - retry === true       → enabled with defaults
  // - retry is object      → enabled with merged overrides
  if (retry === false) {
    return { enabled: false };
  }

  if (retry == null || retry === true) {
    return { enabled: true, attempts: 3, base: 50, factor: 2, jitter: true };
  }

  return {
    enabled: true,
    attempts: retry.attempts ?? 3,
    base: retry.base ?? 50,
    factor: retry.factor ?? 2,
    jitter: retry.jitter ?? true,
  };
}
