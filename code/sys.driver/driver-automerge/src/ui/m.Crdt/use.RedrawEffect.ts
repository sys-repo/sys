import React from 'react';
import { type t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Triggers redraw on Doc<T> changes.
 */
export function useRedrawEffect<T extends O = O>(
  doc?: t.CrdtRef<T>,
  onRedraw?: (e: t.CrdtRedrawEvent<T>) => void,
): t.CrdtRedrawHook {
  /**
   * Hooks:
   */
  const [count, setRender] = React.useState(0);
  const redraw = () => setRender((n) => n + 1);

  /**
   * Effect:
   */
  React.useEffect(() => {
    if (!doc) return;

    const events = doc?.events();
    events.$.subscribe((change) => {
      onRedraw?.({ doc, change });
      redraw();
    });

    return events.dispose;
  }, [doc?.id]);

  /**
   * API:
   */
  return { count, doc };
}
