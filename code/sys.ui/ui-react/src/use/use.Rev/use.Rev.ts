import { useCallback, useMemo, useRef, useState } from 'react';
import { type t, Schedule } from '../common.ts';

/**
 * Hook: useCoalescedRev
 *
 * Returns a tuple [rev, bump] where:
 * - `rev` is a monotonic counter
 * - `bump()` increments it, coalesced by the given schedule mode
 *
 * Ideal for throttling rapid state changes or aligning UI redraws
 * to a specific scheduling queue (`'micro'`, `'macro'`, or `'raf'`).
 *
 * Example:
 * ```ts
 * const [rev, bump] = useCoalescedRev('raf');
 * useEffect(bump, [docRev, yaml.rev, cursorDeps]);
 * ```
 */
export function useRev(mode: t.AsyncSchedule = 'raf') {
  const [rev, setRev] = useState(0);

  // Create a lifecycle-aware scheduler.
  const scheduler = useMemo(() => Schedule.make(undefined, mode), [mode]);
  const queued = useRef(false);

  const bump = useCallback(() => {
    if (queued.current) return;
    queued.current = true;
    scheduler(() => {
      queued.current = false;
      setRev((n) => n + 1);
    });
  }, [scheduler]);

  return [rev, bump] as const;
}
