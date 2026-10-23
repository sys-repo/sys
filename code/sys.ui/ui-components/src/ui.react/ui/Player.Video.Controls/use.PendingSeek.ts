import React from 'react';
import { type t } from './common.ts';

/**
 * Hook to bridge async video seek gap.
 *
 * Problem: When user seeks via slider, the video element takes time to
 * actually seek. If we immediately show `actualTime`, the slider snaps
 * back to the old position before the video catches up.
 *
 * Solution: Hold a `pendingSeek` time locally until video catches up,
 * then clear it and resume showing `actualTime`.
 */
export function usePendingSeek(
  actualTime: t.Secs,
  resetDeps: React.DependencyList = [],
  threshold: t.Secs = 0.5,
): t.UsePendingSeekResult {
  const [pendingSeek, setPendingSeek] = React.useState<t.Secs | undefined>();

  // Clear pending seek once video catches up.
  React.useEffect(() => {
    if (pendingSeek !== undefined && Math.abs(actualTime - pendingSeek) < threshold) {
      setPendingSeek(undefined);
    }
  }, [actualTime, pendingSeek, threshold]);

  // Clear pending seek when dependencies change (e.g., deck switch).
  React.useEffect(() => setPendingSeek(undefined), resetDeps);

  return {
    currentTime: pendingSeek ?? actualTime,
    setPendingSeek,
  };
}
