import { Http, type t, Time } from '../common.ts';

export const DEFAULT_TIMEOUT = 10_000;

type UsingServerArgsCallback = (e: UsingServerArgsCallbackArgs) => Promise<void>;
type UsingServerArgsCallbackArgs = { readonly url: t.HttpUrl; readonly fetch: t.HttpFetch };
type UsingServerArgs = {
  app: t.HonoApp;
  fn: UsingServerArgsCallback;
  timeout?: t.Msecs;

  /** Optional custom fetcher (e.g. Range requests). Must be disposed by fixture. */
  mkFetch?: () => t.HttpFetch;
};

export async function usingServer(args: UsingServerArgs): Promise<void> {
  const { app, fn, timeout = DEFAULT_TIMEOUT, mkFetch } = args;
  const ac = new AbortController();
  const listener = Deno.serve({ port: 0, signal: ac.signal }, app.fetch);
  const url = Http.url(listener.addr);
  const fetch = (mkFetch ?? (() => Http.fetcher()))();

  let didAbort = false;

  try {
    await fn({ url, fetch });
  } finally {
    try {
      fetch.dispose();
    } catch {
      // ignore
    }

    /**
     * Kill switch:
     * - Prefer graceful shutdown
     * - Only abort as a fallback (abort can throw asynchronously inside Deno's handler)
     */
    try {
      await withTimeout(listener.shutdown(), 'listener.shutdown()', timeout);
    } catch {
      didAbort = true;
      // Abort is a fallback only. Do NOT call abort again elsewhere.
      ac.abort();
      // Best-effort: give the runtime a moment to observe the abort.
      await Time.wait(25);
    }

    // No unconditional ac.abort() here.
    // If shutdown succeeded: don't abort.
    // If shutdown failed: we already aborted once above.
    void didAbort;
  }
}

export async function withTimeout<T>(
  p: Promise<T>,
  label: string,
  timeout: t.Msecs = DEFAULT_TIMEOUT,
): Promise<T> {
  const ac = new AbortController();
  type Race =
    | { readonly tag: 'value'; readonly value: T }
    | { readonly tag: 'err'; readonly err: unknown }
    | { readonly tag: 'timeout' }
    | { readonly tag: 'aborted' };

  const pv: Promise<Race> = p
    .then((value) => ({ tag: 'value', value }) as const)
    .catch((err) => ({ tag: 'err', err }) as const);

  // `Time.wait` supports AbortSignal; on abort it will reject.
  // We convert that into `{ tag:'aborted' }` so we never leak an unhandled rejection.
  const tv: Promise<Race> = Time.wait(timeout, { signal: ac.signal })
    .then(() => ({ tag: 'timeout' }) as const)
    .catch(() => ({ tag: 'aborted' }) as const);

  try {
    const res = await Promise.race([pv, tv]);

    if (res.tag === 'timeout') throw new Error(`[test-timeout] ${label} exceeded ${timeout}ms`);
    if (res.tag === 'err') throw res.err;

    // 'value' is the only success path; 'aborted' cannot win the race unless p is pending
    // and the timer was aborted early by some external signal (still fine to treat as “no timeout”).
    if (res.tag === 'value') return res.value;

    // If 'aborted' wins (unexpected), fall back to awaiting the original promise.
    return await p;
  } finally {
    ac.abort(); // cancels the timer so Deno leak detector stays clean
  }
}
