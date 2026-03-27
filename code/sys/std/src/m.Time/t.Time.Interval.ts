import type { t } from './common.ts';

type TimeIntervalOptsInput = TimeIntervalOptions | AbortSignal | AbortController;
type TimeIntervalFnCallbackFirst = (
  msecs: t.Msecs,
  fn: t.TimeIntervalCallback,
  options?: TimeIntervalOptsInput,
) => t.TimeInterval;

type TimeIntervalFnOptionsFirst = (
  msecs: t.Msecs,
  options: TimeIntervalOptsInput,
  fn: t.TimeIntervalCallback,
) => t.TimeInterval;

/** Overloaded interval. */
export type TimeIntervalFn = TimeIntervalFnCallbackFirst & TimeIntervalFnOptionsFirst;

/** Options for `Time.interval`. */
export type TimeIntervalOptions = {
  /** Abort to cancel the running interval. */
  readonly signal?: AbortSignal;
  /** Run the callback once immediately before scheduling the repeating interval. */
  readonly immediate?: boolean;
};

/** One callback invoked on each interval tick. */
export type TimeIntervalCallback = () => void;

/** Handle for one running interval. */
export type TimeInterval = t.Cancellable & {
  /** Configured interval duration. */
  readonly interval: t.Msecs;
  /** Boolean status flags. */
  readonly is: {
    /** True if the interval has been cancelled. */
    readonly cancelled: boolean;
    /** True if the interval is no longer running. */
    readonly done: boolean;
    /** True while the interval is still active. */
    readonly running: boolean;
  };
};
