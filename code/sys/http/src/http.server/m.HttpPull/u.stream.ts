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
  const { map, retry } = options;

  const client = options.client ?? HttpClient.fetcher();
  const concurrency = Math.max(1, options.concurrency ?? 8);
  const total = urls.length;

  /**
   * Aggregated records for the stream.
   * Used to compute the final HttpPullToDirResult returned via `done`.
   */
  const records: t.HttpPullRecord[] = [];

  /**
   * IMPORTANT:
   * We do not rely on Rx.abortable(...) to actually abort fetches.
   * Cancellation must deterministically trigger AbortController.abort().
   */
  const life = Rx.lifecycle(options.until);
  const controller = new AbortController();
  const signal = controller.signal;

  const q = makeEventQueue<t.HttpPullEvent>();
  const lim = semaphore(concurrency);

  // Hot subject mirroring progress events to observable subscribers.
  const subject$ = Rx.subject<t.HttpPullEvent>();
  let cancelled = false;

  // Forward lifecycle cancellation: mark, abort in-flight work, then complete the subject.
  life.dispose$.subscribe((reason) => {
    cancelled = true;

    // Abort any in-flight fetch/body-read/race in pullOne.
    // Note: AbortController.abort(reason) is supported; type is unknown.
    controller.abort(reason);
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
        const record = await pullOne(source, dir, client, { map, signal, retry });
        if (signal.aborted) return; // Silent bail on cancellation.

        // Track every attempted URL so `done` can compute the HttpPullToDirResult.
        records.push(record);

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

          const record: t.HttpPullRecord = { ok: false, error, path: { source, target } };
          records.push(record);

          const errEvent: t.HttpPullEvent = { kind: 'error', index: i, total, url: source, record };
          q.push(errEvent);
          subject$.next(errEvent);
        }
      }
    }),
  );

  /**
   * Shared completion for all pull tasks.
   * Both the queue-closer and `done` derive from this.
   */
  const settled = Promise.allSettled(tasks);

  /**
   * Aggregated result of the pull-stream.
   *
   * Resolves when all tasks have settled (success, error, or cancellation).
   * - `ok` is true only if every attempted record succeeded.
   * - `ops` contains one HttpPullRecord per attempted URL.
   */
  const done: Promise<t.HttpPullToDirResult> = (async () => {
    await settled;

    const ops = records as readonly t.HttpPullRecord[];
    const ok = ops.every((r) => r.ok);

    return { ok, ops };
  })();

  /** Close the queue when all tasks settle (including on cancel). */
  (async () => {
    try {
      // Only depend on task settlement, not on `done` itself,
      // to avoid any accidental cycles.
      await settled;
    } finally {
      q.close();
      if (!cancelled) subject$.complete();
    }
  })();

  /** Async generator loop: */
  const iterator = async function* () {
    try {
      for await (const ev of q) {
        if (signal.aborted) break;
        yield ev;
      }
    } finally {
      // If consumer stops early, ensure lifecycle cleanup.
      life.dispose();

      // Ensure no in-flight fetch survives a consumer break.
      controller.abort('iterator:closed');
    }
  };

  /**
   * API:
   */
  return {
    [Symbol.asyncIterator]: () => iterator(),

    /** Abort in-flight requests and complete the stream. */
    cancel: (reason?: unknown) => life.dispose(reason),

    /** Aggregated pull result. */
    done,

    /** Observable of progress events (completes on finish/cancel). */
    events(until?: t.UntilInput) {
      const child = Rx.lifecycle([life, until]);

      // When the child lifecycle disposes, explicitly complete the stream.
      child.dispose$.subscribe(() => subject$.complete());

      return Rx.toLifecycle<t.HttpPullStreamEvents>(child, {
        $: subject$.asObservable(),
      });
    },
  };
}
