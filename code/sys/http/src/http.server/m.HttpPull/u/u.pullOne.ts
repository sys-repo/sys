import { Fs, Path, type t, Url } from '../common.ts';
import { fetchBytes } from './u.fetch.ts';
import { isAbortError, resolveTarget } from './u.ts';

export async function pullOne(
  url: t.StringUrl,
  dir: t.StringDir,
  client: t.HttpFetch.Instance,
  opts: {
    map?: t.HttpPull.Map.Options;
    signal?: AbortSignal;
    retry?: t.HttpPull.Options['retry'];
  },
): Promise<t.HttpPull.Record> {
  const { map, signal } = opts;

  /** -------------------------------------------------------
   * Main body
   */
  const target = resolveTarget(url, dir, map);
  const u = Url.parse(url);

  if (!u.ok) {
    return { ok: false, error: 'Invalid URL', path: { source: url, target } };
  }

  try {
    await Fs.ensureDir(Path.dirname(target));

    const fetchPromise = fetchBytes(u.toURL(), client, { signal, retry: opts.retry });
    const result = signal == null
      ? await fetchPromise
      : await fetchWithAbortRace(signal, fetchPromise);

    if (!result.ok) {
      return {
        ok: false,
        status: result.status,
        error: result.error,
        path: { source: url, target },
      };
    }

    await Fs.write(target, result.bytes, { force: true });

    return {
      ok: true,
      status: result.status,
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
 * Races a fetch-style promise against an AbortSignal.
 *
 * Behaviour:
 *   - If the fetch promise settles first, its result is returned.
 *   - If the signal aborts first, a DOMException("Aborted", "AbortError") is thrown.
 *
 * This mirrors the semantics of a cancelled fetch so that `isAbortError(...)`
 * higher up can recognise and handle the abort in a consistent way.
 */
async function fetchWithAbortRace<T>(signal: AbortSignal, fetchPromise: Promise<T>): Promise<T> {
  // If already aborted, fail fast with a standard AbortError.
  if (signal.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }

  // Promise that resolves when the abort signal fires; used as the other side of the race.
  let onAbort = () => {};
  const abortPromise = new Promise<'aborted'>((resolve) => {
    onAbort = () => resolve('aborted');
    signal.addEventListener('abort', onAbort, { once: true });
  });

  try {
    const winner = await Promise.race<T | 'aborted'>([fetchPromise, abortPromise]);

    // If the abort side won the race, propagate a proper AbortError.
    if (winner === 'aborted') {
      throw new DOMException('Aborted', 'AbortError');
    }

    return winner;
  } finally {
    signal.removeEventListener('abort', onAbort);
  }
}
