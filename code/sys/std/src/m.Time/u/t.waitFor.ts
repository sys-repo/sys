import type { t } from '../common.ts';

/** Package-private polling effects; wake callbacks are queued, never invoked inline. */
export type WaitForEffects = {
  readonly now: () => t.Msecs;
  readonly wake: (msecs: t.Msecs, fn: () => void) => () => void;
  /** Failed registration must release anything it acquired before throwing. */
  readonly listen: (signal: AbortSignal, fn: () => void) => () => void;
};

/** Public options projected internally without adding an exported clock contract. */
export type WaitForOptions = NonNullable<Parameters<t.Time.Lib['waitFor']>[1]>;
