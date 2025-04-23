import { type t } from './common.ts';

/**
 * Hook for managing the pulldown.
 */
export type UsePulldown = (props: t.VideoContentProps, timestamp: t.TimestampsHook) => PulldownHook;
export type PulldownHook = {
  readonly is: { readonly showing: boolean };
};
