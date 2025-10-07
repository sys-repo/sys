import { useEffect, useMemo, useState } from 'react';
import { type t, Is, Schedule, useFunction } from './common.ts';

type O = Record<string, unknown>;

/**
 * Triggers a monotonic `rev` increment whenever
 * the given CRDT document changes.
 *
 * - Coalesces multiple change events per tick into one redraw.
 * - Supports path-scoped change subscriptions.
 * - Optional callbacks: `onRedraw`, `onError`.
 */
export function useRev<T extends O = O>(
  doc?: t.CrdtRef<T>,
  opts?: t.UseCrdtRevOptions<T> | t.CrdtRevChangeHandler<T> | t.ObjectPath | t.ObjectPath[],
): t.CrdtRev {
  const options = wrangle.options<T>(opts);
  const paths = wrangle.path(options.path);
  const pathKey = useMemo(() => paths.map((p) => p.join()).join('|'), [paths]);

  const onRedraw = useFunction(options.onRedraw);
  const onError = useFunction(options.onError);

  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!doc) return;

    const events = doc.events();
    const schedule = Schedule.make(events, 'micro');
    const scheduleRedraw = makeCoalescer(schedule);
    const streams = paths.length === 0 ? [events.$] : paths.map((p) => events.path(p).$);

    streams.forEach(($) =>
      $.subscribe((change) => {
        schedule(() => {
          if (events.disposed) return;

          try {
            onRedraw?.({ rev, doc, change });
          } catch (err) {
            try {
              onError?.(err);
            } catch {
              /* swallow user error */
            }
          }

          scheduleRedraw(() => {
            if (events.disposed) return;
            setRev((n) => n + 1);
          });
        });
      }),
    );

    return events.dispose;
  }, [doc?.id, doc?.instance, pathKey]);

  return { rev, doc };
}

/**
 * Helpers
 */
const makeCoalescer = (schedule: (fn: () => void) => void) => {
  let queued = false;
  return (fn: () => void) => {
    if (queued) return;
    queued = true;
    schedule(() => {
      queued = false;
      fn();
    });
  };
};

const wrangle = {
  options<T extends O>(
    input?: t.UseCrdtRevOptions<T> | t.CrdtRevChangeHandler<T> | t.ObjectPath | t.ObjectPath[],
  ): t.UseCrdtRevOptions<T> {
    if (!input) return {};
    if (Is.func(input)) return { onRedraw: input };
    if (Array.isArray(input)) return { path: input };
    return input;
  },

  path(input: t.ObjectPath | t.ObjectPath[] = []): t.ObjectPath[] {
    const done = (res: t.ObjectPath[]) => res.filter((a) => a.length > 0);
    if (Array.isArray(input[0])) return done(input as t.ObjectPath[]);
    return done([input as t.ObjectPath]);
  },
} as const;
