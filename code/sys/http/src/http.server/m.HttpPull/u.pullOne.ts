import { type t, Fs, HttpClient, Path, Time } from './common.ts';
import { isAbortError, resolveTarget } from './u.ts';

type FetchResponse =
  | { ok: true; bytes: Uint8Array; status: number }
  | { ok: false; status?: number; error: string };

export async function pullOne(
  url: t.StringUrl,
  dir: t.StringDir,
  client: t.HttpFetch,
  map?: t.HttpPullMapOptions,
  signal?: AbortSignal,
): Promise<t.HttpPullRecord> {
  /**
   * Minimal URL parser used only to determine fetch-eligibility.
   */
  function safeUrl(input: string): URL | undefined {
    try {
      return new URL(input);
    } catch {
      return undefined;
    }
  }

  /**
   * Fetch a single URL once.
   */
  async function attemptFetch(u: URL): Promise<FetchResponse> {
    const res = await (client as any).blob(u.toString(), { signal });

    if (!res.ok || !res.data) {
      return {
        ok: false,
        status: res.status,
        error: res.error?.message ?? (res.status ? `HTTP ${res.status}` : 'Network error'),
      };
    }

    const bytes = await HttpClient.toUint8Array(res.data);
    return { ok: true, bytes, status: res.status };
  }

  /**
   * Retry wrapper with exponential backoff (5xx only).
   */
  async function fetchWithRetry(u: URL): Promise<FetchResponse> {
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await attemptFetch(u);
        if (result.ok) return result;

        const is5xx = result.status && result.status >= 500 && result.status <= 599;
        const last = attempt === maxAttempts - 1;
        if (!is5xx || last) return result;

        const ms = 200 * Math.pow(2, attempt);
        await Time.delay(ms, () => {}, { signal });
        Time.wait;
      } catch (err) {
        if (isAbortError(err)) throw err;

        const is5xx = String(err).includes('503') || String(err).includes('5');
        const last = attempt === maxAttempts - 1;
        if (!is5xx || last) {
          return { ok: false, error: err instanceof Error ? err.message : String(err) };
        }

        const delay = 200 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return { ok: false, error: 'Unknown pull error' };
  }

  /** -------------------------------------------------------
   * Main body
   */
  const target = resolveTarget(url, dir, map);
  const u = safeUrl(url);

  if (!u) {
    return { ok: false, error: 'Invalid URL', path: { source: url, target } };
  }

  try {
    await Fs.ensureDir(Path.dirname(target) as t.StringDir);

    const result = await fetchWithRetry(u);

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
