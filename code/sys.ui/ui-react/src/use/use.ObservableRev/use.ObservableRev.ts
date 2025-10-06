import { useEffect } from 'react';

import { type t, Rx } from '../common.ts';
import { useRev } from '../use.Rev/mod.ts';

/**
 * Hook: useObservableRev
 *
 * Subscribes to an optional Rx observable and returns a stable
 * callback that triggers a coalesced React revision update.
 */
export const useObservableRev: t.UseObservableRev = ($) => {
  const [, bump] = useRev('raf');

  useEffect(() => {
    if (!$) return;
    const life = Rx.disposable();
    $.pipe(Rx.takeUntil(life.dispose$)).subscribe(bump);
    return life.dispose;
  }, [$, bump]);

  return bump;
};
