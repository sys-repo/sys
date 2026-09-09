import type React from 'react';
import type { t } from './common.ts';

/** Hook to bridge async video seek gap. */
export type UsePendingSeek = (
  actualTime: t.Secs,
  resetDeps?: React.DependencyList,
  threshold?: t.Secs,
) => UsePendingSeekResult;

/** Result returned by usePendingSeek hook. */
export type UsePendingSeekResult = {
  currentTime: t.Secs;
  setPendingSeek: (time: t.Secs | undefined) => void;
};
