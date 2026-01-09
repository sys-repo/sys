import { type t, Fetch, Is } from './common.ts';
import { semaphore } from './u.ts';

export async function preload(
  input: t.HttpPreloadInput,
  options: t.HttpPreloadOptions = {},
): Promise<t.HttpPreloadResult> {
  const targets = wrangle.targets(input);
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const lim = semaphore(concurrency);

  const ownsClient = !options.client;
  const client = options.client ?? Fetch.make(options.until);

  try {
    const tasks = targets.map((target) => lim(() => warmOne(target, client)));
    const ops = await Promise.all(tasks);
    const ok = ops.every((r) => r.ok);
    return { ok, ops };
  } finally {
    if (ownsClient) client.dispose();
  }
}

async function warmOne(
  target: t.HttpPreloadTarget,
  client: t.HttpFetch,
): Promise<t.HttpPreloadRecord> {
  const { url, range } = target;
  const init = wrangle.init(range);

  try {
    if (range) {
      const res = await client.blob(url, init);
      const bytes = res.data?.size;
      return wrangle.record(url, range, res, bytes);
    } else {
      const res = await client.head(url, init);
      const bytes = wrangle.contentLength(res.headers);
      return wrangle.record(url, range, res, bytes);
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    return { url, ok: false, error, range };
  }
}

/**
 * Helpers:
 */
const wrangle = {
  targets(input: t.HttpPreloadInput): t.HttpPreloadTarget[] {
    return input.map((item) =>
      Is.str(item) ? { url: item } : { url: item.url, range: item.range },
    );
  },

  init(range?: t.HttpPreloadByteRange): RequestInit {
    if (!range) return {};
    const end = typeof range.end === 'number' ? range.end : '';
    return { headers: { Range: `bytes=${range.start}-${end}` } };
  },

  record(
    url: t.StringUrl,
    range: t.HttpPreloadByteRange | undefined,
    res: t.FetchResponse<Blob | undefined>,
    bytes?: number,
  ): t.HttpPreloadRecord {
    const status = res.status;
    const ok = res.ok;
    const error = ok ? undefined : (res.error?.message ?? res.statusText);
    return { url, ok, status, bytes, error, range };
  },

  contentLength(headers: Headers): number | undefined {
    const raw = headers.get('content-length');
    const value = raw ? Number(raw) : NaN;
    return Number.isFinite(value) ? value : undefined;
  },
} as const;
