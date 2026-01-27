import { type t, useRev } from './common.ts';
import { useSignalEffect } from './u.useEffect.ts';

/**
 * Safely causes a redraw when any signals touched inside the callback change.
 * - Coalesces multiple changes per tick into a single microtask rev bump.
 * - Dependencies are exactly what the callback reads (no deep walks).
 * - Lifecycle-aware: `e.life` is lazily created if accessed by the callback.
 */
export const useSignalRedrawEffect: t.UseRedrawEffectListener = (cb) => {
  const [, bump] = useRev('micro');
  useSignalEffect((e) => {
    const cleanup = cb(e); //   establish reactive deps; user may touch e.life
    bump(); //                  schedule one redraw on next microtask
    return cleanup; //          preserve user cleanup semantics
  });
};
