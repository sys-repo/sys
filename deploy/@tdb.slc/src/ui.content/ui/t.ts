import type { t } from './common.ts';

type P = t.VideoPlayerSignals;
type T = t.ContentTimestamps;

/**
 * Hook for managing content.
 */
export type UseTimestamps = (player?: P, timestamps?: T) => TimestampsHook;
export type TimestampsHook = {
  readonly column?: t.ReactNode;
  readonly pulldown?: t.ReactNode;
  readonly main?: t.ReactNode;
};
