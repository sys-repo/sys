import { useRev } from '../use/use.Rev/mod.ts';
import { type t, useSignalEffect } from './common.ts';

/**
 * Safely causes a redraw when any signals touched inside `cb()` change.
 * - Coalesces multiple changes per tick into a single microtask rev bump.
 * - No deep walks; dependencies are whatever `cb()` reads.
 * - No Automerge/debug-tooling dependencies.
 */
export const useRedrawEffect: t.SignalReactLib['useRedrawEffect'] = (cb) => {
  const [, bump] = useRev('micro');
  useSignalEffect(() => {
    cb(); //    Establish reactive deps.
    bump(); //  Schedule one redraw on next microtask.
  });
};
