import { useEffect, useMemo, useRef, useState } from 'react';
import { type t, Is, Schedule } from './common.ts';

type O = Record<string, unknown>;

/**
 * Triggers a React redraw when a CRDT Doc changes.
 */
export function useRedrawEffect<T extends O = O>(
  doc?: t.CrdtRef<T>,
  opts?: t.UseRedrawEffectOptions<T> | t.CrdtRedrawEventHandler<T> | t.ObjectPath | t.ObjectPath[],
): t.CrdtRedrawHook {
  const options = wrangle.options<T>(opts);
  const paths = wrangle.path(options.path) ?? [];
  const pathKey = useMemo(() => paths.map((p) => p.join()).join('|'), [paths]);

  /**
   * Refs:
   * (avoid resubscribe churn).
   */
  const onRedrawRef = useRef<typeof options.onRedraw>(null);
  const onErrorRef = useRef<typeof options.onError>(null);
  onRedrawRef.current = options.onRedraw;
  onErrorRef.current = options.onError;

  /**
   * Hooks:
   */
  const [count, setRender] = useState(0);

  /**
   * Effect:
   */
  useEffect(() => {
    if (!doc) return;

    const events = doc.events();
    const schedule = Schedule.make(events, 'micro'); // ← bound to dispose$
    const scheduleRedraw = makeCoalescer(schedule); // ← coalescer also bound to dispose$

    const streams = paths.length === 0 ? [events.$] : paths.map((p) => events.path(p).$);

    streams.map(($) =>
      $.subscribe((change) => {
        schedule(() => {
          if (events.disposed) return;

          try {
            onRedrawRef.current?.({ doc, change });
          } catch (err) {
            try {
              onErrorRef.current?.(err);
            } catch {
              /* swallow: user/handler error */
            }
          }

          scheduleRedraw(() => {
            if (events.disposed) return;
            setRender((n) => n + 1);
          });
        });
      }),
    );

    return events.dispose;
  }, [doc?.id, doc?.instance, pathKey]);

  return { count, doc };
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
    input?:
      | t.UseRedrawEffectOptions<T>
      | t.CrdtRedrawEventHandler<T>
      | t.ObjectPath
      | t.ObjectPath[],
  ): t.UseRedrawEffectOptions<T> {
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
