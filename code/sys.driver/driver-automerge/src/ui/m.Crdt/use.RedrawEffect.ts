import React from 'react';
import { type t } from './common.ts';

/**
 * Triggers redraw on Doc<T> changes.
 */
export const useRedrawEffect: t.UseRedrawEffect = (doc, onRedraw) => {
  const [count, setRender] = React.useState(0);
  const redraw = () => setRender((n) => n + 1);

  /**
   * Effect:
   */
  React.useEffect(() => {
    if (!doc) return;

    const events = doc?.events();
    events.$.subscribe((e) => {
      if (doc) onRedraw?.(doc);
      redraw();
    });

    return events.dispose;
  }, [doc?.id]);

  /**
   * API:
   */
  return { count, doc };
};
