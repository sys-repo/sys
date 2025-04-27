import { type t } from './common.ts';

/**
 * Hook for managing content.
 */
export type UseTimestamps = (
  player?: t.VideoPlayerSignals,
  getContentProps?: () => t.VideoContentProps,
) => TimestampsHook;

export type TimestampsHook = {
  readonly column?: t.ReactNode;
  readonly pulldown?: t.ReactNode;
  readonly main?: t.ReactNode;
};
