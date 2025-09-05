import { type t, HttpClient, rx } from './common.ts';
import { pullOne } from './u.pullOne.ts';
import { isAbortError, makeEventQueue, resolveTarget, semaphore } from './u.ts';


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

  const life = rx.abortable(options.until);
  const { signal } = life;

  const q = makeEventQueue<t.HttpPullEvent>();
  const lim = semaphore(concurrency);

  let index = 0;
  const tasks = urls.map((source) =>
    lim(async () => {
      if (signal.aborted) return; // Bail fast.
      const i = index++ as t.Index;

      // Start:
      if (!signal.aborted) q.push({ kind: 'start', index: i, total, url: source });

      try {
        const record = await pullOne(source, dir, client, options.map, signal);
        if (signal.aborted) return; // ← Silent bail on cancellation.

        if (record.ok) {
          q.push({ kind: 'done', index: i, total, record, url: source });
        } else {
          q.push({ kind: 'error', index: i, total, record, url: source });
        }
      } catch (err) {
        // Swallow expected aborts; surface real failures.
        if (!isAbortError(err)) {
          const error = err instanceof Error ? err.message : String(err);
          const target = resolveTarget(source, dir, options.map);
          q.push({
            kind: 'error',
            index: i,
            total,
            url: source,
            record: { ok: false, error, path: { source, target } },
          });
        }
      }
    }),
  );

  (async () => {
    try {
      await Promise.allSettled(tasks); // Ensures close on cancellation.
    } finally {
      q.close();
    }
  })();

  try {
    for await (const ev of q) {
      if (signal.aborted) break;
      yield ev;
    }
  } finally {
    // If consumer stops early, ensure we abort/dispose once.
    try {
      if (!signal.aborted) (life as any).abort?.();
    } finally {
      (life as any).dispose?.();
    }
  }
}
