import type { t } from './common.ts';

/**
 * Tools for working with promises.
 */
export type PromiseLib = {
  /** Determine if the value is a Promise. */
  isPromise: t.StdIsLib['promise'];

  /** Wait for the promise to complete if the value is a promise; otherwise resolve immediately. */
  maybeWait<T>(value: T | Promise<T>): Promise<T>;

  /** Return a limiter that runs at most `max` promise tasks concurrently (excess tasks are queued). */
  semaphore: Semaphore;
};

/**
 * Wait for the promise to complete if the given value
 * is a promise; otherwise resolve immediately.
 */
export type MaybeWait = <T>(value: T | Promise<T>) => Promise<T>;

/**
 * Return a limiter that runs at most `max` promise tasks concurrently
 * (excess tasks are queued).
 */
export type Semaphore = <T>(max: number) => (fn: () => Promise<T>) => Promise<T>;
