import { type t } from './common.ts';

/**
 * Hook for managing content.
 */
export type UseTimestamps = (
  props: t.VideoContentProps,
  player?: t.VideoPlayerSignals,
) => TimestampsHook;

export type TimestampsHook = {
  readonly column?: t.ReactNode;
  readonly pulldown?: t.ReactNode;
};
