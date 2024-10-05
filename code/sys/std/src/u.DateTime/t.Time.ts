import type { t } from './common.ts';

export type TimeLib = {
  /**
   * Run a function after a delay.
   */
  delay(msecs: t.Msecs, fn?: t.TimeDelayCallback): t.TimeDelayPromise;
  delay(fn?: t.TimeDelayCallback): t.TimeDelayPromise;

  /**
   * Wait for the specified milliseconds
   * NB: use with [await].
   */
  wait(msecs: t.Msecs): t.TimeDelayPromise;
};

/**
 * Timout/Delay
 */
export type TimeDelayCallback = () => void;
export type TimeDelayPromise = Promise<void> & t.TimeDelay;
export type TimeDelay = {
  readonly timeout: t.Msecs;
  readonly is: { readonly cancelled: boolean; readonly completed: boolean; readonly done: boolean };
  cancel(): void;
};
