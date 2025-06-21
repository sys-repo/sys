import React from 'react';
import { type t } from './common.ts';

/**
 * Triggers redraw on Doc<T> changes.
 */
export const useRedrawEffect: t.UseRedrawEffect = (doc) => {
  const [, setRender] = React.useState(0);
  const redraw = () => setRender((n) => n + 1);

  React.useEffect(() => {
    if (!doc) return;
    const events = doc.events();
    events.$.subscribe(redraw);
    return events.dispose;
  }, [doc?.id]);

  return { doc };
};
