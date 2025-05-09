import { type t } from './common.ts';

/**
 * Hook for managing the pulldown.
 */
export type UsePulldown = (
  props: t.VideoContentProps,
  player: t.VideoPlayerSignals,
  timestamp: t.RenderedTimestamp,
) => PulldownHook;
export type PulldownHook = {
  readonly is: { readonly showing: boolean };
};
