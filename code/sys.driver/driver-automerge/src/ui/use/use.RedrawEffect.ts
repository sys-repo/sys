import { useEffect, useState } from 'react';
import { type t, Is } from './common.ts';

type O = Record<string, unknown>;

/**
 * Triggers redraw on Doc<T> changes.
 * Subscribes to doc.events() but defers work to next microtask to avoid
 * re-entrancy with Automerge internals.
 */
export function useRedrawEffect<T extends O = O>(
  doc?: t.CrdtRef<T>,
  opts?: t.UseRedrawEffectOptions<T> | t.CrdtRedrawEventHandler<T> | t.ObjectPath | t.ObjectPath[],
): t.CrdtRedrawHook {
  const options = wrangle.options<T>(opts);
  const { onRedraw } = options;
  const paths = wrangle.path(options.path) ?? [];

  /**
   * Hooks:
   */
  const [count, setRender] = useState(0);
  const schedule = makeCoalescer(); // coalesce one redraw per microtask

  /**
   * Effect:
   */
  useEffect(() => {
    if (!doc) return;
    const ev = doc.events();
    const streams = paths.length === 0 ? [ev.$] : paths.map((p) => ev.path(p).$);

    const subs = streams.map(($) =>
      $.subscribe((change) => {
        // Do NOT touch doc.current here; we’re still on AM’s call stack:
        queueMicrotask(() => {
          onRedraw?.({ doc, change }); // Safe now.
          schedule(() => setRender((n) => n + 1));
        });
      }),
    );

    return () => {
      subs.forEach((s) => s.unsubscribe?.());
      ev.dispose();
    };
  }, [doc?.id, doc?.instance, paths.map((p) => p.join()).join('|')]);

  return { count, doc };
}

/**
 * Helpers:
 */
const makeCoalescer = () => {
  let queued = false;
  return (fn: () => void) => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
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
