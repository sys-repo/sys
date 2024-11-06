import { useEffect, useState } from 'react';
import { rx, type t } from '../common.ts';

/**
 * HOOK: provide simple counter incrementing component "redraw" API.
 */
export function useRedraw(redraw$?: t.Observable<any>) {
  const [, setCount] = useState(0);
  const redraw = () => setCount((n: number) => n + 1);

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
}
