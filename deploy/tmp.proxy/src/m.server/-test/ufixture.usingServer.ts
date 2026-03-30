import { Http, Time, type t } from '../common.ts';

export const DEFAULT_TIMEOUT = 10_000;

type UsingServerArgsCallback = (e: UsingServerArgsCallbackArgs) => Promise<void>;
type UsingServerArgsCallbackArgs = {
  readonly url: t.HttpUrl;
  readonly fetch: t.HttpFetch;
};
type UsingServerArgs = {
  readonly app: t.HonoApp;
  readonly fn: UsingServerArgsCallback;
  readonly timeout?: number;
  readonly mkFetch?: () => t.HttpFetch;
};

export async function usingServer(args: UsingServerArgs): Promise<void> {
  const { app, fn, timeout = DEFAULT_TIMEOUT, mkFetch } = args;
  const { signal, abort } = new AbortController();
  const listener = Deno.serve({ port: 0, signal }, app.fetch);
  const url = Http.Client.url(listener.addr);
  const fetch = (mkFetch ?? (() => Http.client()))();

  try {
    await fn({ url, fetch });
  } finally {
    try {
      fetch.dispose();
    } catch {
      // ignore
    }

    try {
      await withTimeout(listener.shutdown(), 'listener.shutdown()', timeout);
    } catch {
      abort();
      await Time.wait(25);
    }
  }
}

async function withTimeout<T>(p: Promise<T>, label: string, timeout: number): Promise<T> {
  const ac = new AbortController();
  type Race =
    | { readonly tag: 'value'; readonly value: T }
    | { readonly tag: 'err'; readonly err: unknown }
    | { readonly tag: 'timeout' }
    | { readonly tag: 'aborted' };

  const pv: Promise<Race> = p
    .then((value) => ({ tag: 'value', value }) as const)
    .catch((err) => ({ tag: 'err', err }) as const);

  const tv: Promise<Race> = Time.wait(timeout, { signal: ac.signal })
    .then(() => ({ tag: 'timeout' }) as const)
    .catch(() => ({ tag: 'aborted' }) as const);

  try {
    const res = await Promise.race([pv, tv]);

    if (res.tag === 'timeout') throw new Error(`[test-timeout] ${label} exceeded ${timeout}ms`);
    if (res.tag === 'err') throw res.err;
    if (res.tag === 'value') return res.value;
    return await p;
  } finally {
    ac.abort();
  }
}
