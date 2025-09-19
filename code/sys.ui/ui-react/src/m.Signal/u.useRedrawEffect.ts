import { useRef, useState } from 'react';
import { type t, useSignalEffect } from './common.ts';

/**
 * Safely causes a redraw when any signals touched inside `cb()` change.
 * - Coalesces multiple changes per tick into a single microtask redraw.
 * - No deep walks; dependencies are whatever `cb()` reads.
 * - No Automerge/debug-tooling dependencies.
 */
export const useRedrawEffect: t.SignalReactLib['useRedrawEffect'] = (cb) => {
  const [, setRender] = useState(0);

  /**
   * Refs:
   */
  const scheduleRef = useRef<ReturnType<typeof makeCoalescer> | null>(null);
  if (!scheduleRef.current) scheduleRef.current = makeCoalescer();

  /**
   * Effects:
   */
  useSignalEffect(() => {
    cb(); // Establish reactive deps.
    scheduleRef.current?.(() => setRender((n) => n + 1)); // NB: one redraw next microtask.
  });
};

/**
 * Helpers:
 */
const makeCoalescer = () => {
  let queued = false;
  return (fn: () => void) => {
    if (queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      fn();
    });
  };
};
