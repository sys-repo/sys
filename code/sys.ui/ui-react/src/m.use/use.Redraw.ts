import { useEffect, useState } from 'react';
import { rx, type t } from './common.ts';

/**
 * Hook: provide simple counter incrementing component "redraw" API.
 */
export const useRedraw: t.UseRedraw = (redraw$) => {
  const [, setCount] = useState(0);
  const redraw = () => setCount((n) => n + 1);

  useEffect(() => {
    const life = rx.disposable();
    const $ = redraw$?.pipe(
      rx.takeUntil(life.dispose$),
      rx.debounceTime(10, rx.animationFrameScheduler),
    );
    $?.subscribe(redraw);
    return life.dispose;
  }, [redraw$]);

  return redraw;
};
