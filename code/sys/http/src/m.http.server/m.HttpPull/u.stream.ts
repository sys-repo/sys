import { type t, Fs, HttpClient, Path } from './common.ts';

import { PullMap } from './u.Map.ts';
import { makeEventQueue, sanitizeForFilename, semaphore } from './u.ts';

/**
 * Same as `toDir`, but yields progress events.
 * Emission order is not guaranteed to be request order.
 */
export async function* stream(
  urls: readonly string[],
  dir: t.StringDir,
  options: t.HttpPullOptions = {},
): AsyncGenerator<t.HttpPullEvent> {
  const client = options.client ?? HttpClient.fetcher();
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const total = urls.length;

  // Simple async queue so workers can push events and the generator yields them as they arrive.
  const q = makeEventQueue<t.HttpPullEvent>();
  const lim = semaphore(concurrency);

  // Launch workers:
  let index = 0;
  const tasks = urls.map((source) =>
    lim(async () => {
      const i = index++ as t.Index;

      // Start:
      q.push({ kind: 'start', index: i, total, url: source });
      const record = await pullOne(source, dir, client, options.map);

      // Done / error:
      if (record.ok) {
        q.push({ kind: 'done', index: i, total, record, url: source });
      } else {
        q.push({ kind: 'error', index: i, total, record, url: source });
      }
    }),
  );

  // Close queue when all workers finish.
  (async () => {
    try {
      await Promise.all(tasks);
    } finally {
      q.close();
    }
  })();

  // Drain queue to the consumer:
  for await (const ev of q) yield ev;
}

/**
 * One URL → one file write → one record.
 * (mirrors the logic in toDir)
 */
async function pullOne(
  url: string,
  dir: t.StringDir,
  client: t.HttpFetch,
  map?: t.HttpPullMapOptions,
): Promise<t.HttpPullRecord> {
  let u: URL | undefined;
  let target: t.StringPath | undefined;

  try {
    u = new URL(url);
  } catch {
    const safe = sanitizeForFilename(url);
    target = Fs.join(dir, safe) as t.StringPath;
    return {
      ok: false,
      error: 'Invalid URL',
      path: { source: url, target },
    };
  }

  try {
    const rel = PullMap.urlToPath(u, map);
    target = Fs.join(dir, rel) as t.StringPath;

    await Fs.ensureDir(Path.dirname(target) as t.StringDir);

    const res = await client.blob(u.toString());
    if (!res.ok || !res.data) {
      return {
        ok: false,
        status: res.status as t.HttpStatusCode | undefined,
        error: res.error?.message ?? (res.status ? `HTTP ${res.status}` : 'Network error'),
        path: { source: url, target },
      };
    }

    const bytes = await HttpClient.toUint8Array(res.data);
    await Fs.write(target, bytes, { force: true });

    return {
      ok: true,
      status: res.status as t.HttpStatusCode | undefined,
      bytes: bytes.byteLength as t.NumberBytes,
      path: { source: url, target },
    };
  } catch (err) {
    const fallback = target ?? (Fs.join(dir, PullMap.urlToPath(u)) as t.StringPath);

    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      path: { source: url, target: fallback },
    };
  }
}
