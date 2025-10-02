import { useEffect, useState } from 'react';
import { type t, Rx } from '../common.ts';

/**
 * Hook: provide simple counter incrementing component "redraw" API.
 */
export const useRedraw: t.UseRedraw = (redraw$) => {
  const [, setCount] = useState(0);
  const redraw = () => setCount((n) => n + 1);

  useEffect(() => {
    const life = Rx.disposable();
    const $ = redraw$?.pipe(
      Rx.takeUntil(life.dispose$),
      Rx.debounceTime(10, Rx.animationFrameScheduler),
    );
    $?.subscribe(redraw);
    return life.dispose;
  }, [redraw$]);

  return redraw;
};
