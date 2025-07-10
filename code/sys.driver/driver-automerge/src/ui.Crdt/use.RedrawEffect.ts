import { useEffect, useState } from 'react';
import { type t, Is } from './common.ts';

type O = Record<string, unknown>;

/**
 * Triggers redraw on Doc<T> changes.
 */
export function useRedrawEffect<T extends O = O>(
  doc?: t.CrdtRef<T>,
  opt?: t.UseRedrawEffectOptions<T> | t.CrdtRedrawEventHandler<T> | t.ObjectPath | t.ObjectPath[],
): t.CrdtRedrawHook {
  const options = wrangle.options<T>(opt);
  const { onRedraw } = options;
  const path = wrangle.path(options.path) ?? [];

  /**
   * Hooks:
   */
  const [count, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  /**
   * Effect:
   */
  useEffect(() => {
    if (!doc) return;

    const events = doc?.events();
    const $ = path.length === 0 ? events.$ : events.path(path).$;

    $.subscribe((change) => {
      onRedraw?.({ doc, change });
      redraw();
    });

    return events.dispose;
  }, [doc?.id, path.join()]);

  /**
   * API:
   */
  return { count, doc };
}

/**
 * Helpers:
 */
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
