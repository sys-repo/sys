import { type t, HttpClient, Rx } from './common.ts';
import { pullOne } from './u.pullOne.ts';
import { isAbortError, makeEventQueue, resolveTarget, semaphore } from './u.ts';

/**
 * Same as `toDir`, but yields progress events.
 * Emission order is not guaranteed to match request order.
 *
 * Usage:
 *   for await (const e of stream(urls, dir, opts)) { ... }
 *   stream(urls, dir, opts).events().$.subscribe(...)
 *   stream(urls, dir, opts).cancel(); // aborts in-flight work
 */
export function stream(
  urls: readonly string[],
  dir: t.StringDir,
  options: t.HttpPullOptions = {},
): t.HttpPullStream {
  const client = options.client ?? HttpClient.fetcher();
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const total = urls.length;

  // System lifecycle (drives cancellation via dispose$ → controller.abort()).
  const life = Rx.abortable(options.until);
  const { signal } = life;

  const q = makeEventQueue<t.HttpPullEvent>();
  const lim = semaphore(concurrency);

  // Hot subject mirroring progress events to observable subscribers.
  const subject$ = Rx.subject<t.HttpPullEvent>();
  let cancelled = false;

  // Forward lifecycle cancellation: mark, then complete the subject.
  life.dispose$.subscribe(() => {
    cancelled = true;
    subject$.complete();
  });

  let index = 0;
  const tasks = urls.map((source) =>
    lim(async () => {
      if (signal.aborted) return; // Bail fast.
      const i = index++ as t.Index;

      // Start:
      if (!signal.aborted) {
        const ev: t.HttpPullEvent = { kind: 'start', index: i, total, url: source };
        q.push(ev);
        subject$.next(ev);
      }

      try {
        const record = await pullOne(source, dir, client, options.map, signal);
        if (signal.aborted) return; // Silent bail on cancellation.

        const ev: t.HttpPullEvent = record.ok
          ? { kind: 'done', index: i, total, record, url: source }
          : { kind: 'error', index: i, total, record, url: source };

        q.push(ev);
        subject$.next(ev);
      } catch (err) {
        // Swallow expected aborts; surface real failures.
        if (!isAbortError(err)) {
          const error = err instanceof Error ? err.message : String(err);
          const target = resolveTarget(source, dir, options.map);
          const ev: t.HttpPullEvent = {
            kind: 'error',
            index: i,
            total,
            url: source,
            record: { ok: false, error, path: { source, target } },
          };
          q.push(ev);
          subject$.next(ev);
        }
      }
    }),
  );

  // Close the queue when all tasks settle (including on cancel).
  (async () => {
    try {
      await Promise.allSettled(tasks);
    } finally {
      q.close();
      if (!cancelled) subject$.complete();
    }
  })();

  // Async generator loop:
  const iterator = async function* () {
    try {
      for await (const ev of q) {
        if (signal.aborted) break;
        yield ev;
      }
    } finally {
      // If consumer stops early, ensure lifecycle cleanup.
      life.dispose();
    }
  };

  return {
    [Symbol.asyncIterator]: () => iterator(),

    /** Abort in-flight requests and complete the stream. */
    cancel: (reason?: unknown) => life.dispose(reason),

    /** Observable of progress events (completes on finish/cancel). */
    events(until?: t.UntilInput) {
      const child = Rx.lifecycle([life, until]);
      const $ = subject$.pipe(Rx.takeUntil(child.dispose$));
      return Rx.toLifecycle<t.HttpPullStreamEvents>(child, { $ });
    },
  };
}
