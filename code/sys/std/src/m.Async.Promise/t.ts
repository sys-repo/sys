import type { t } from './common.ts';

/**
 * Tools for working with promises.
 */
export type PromiseLib = {
  /** Determine if the value is a Promise. */
  isPromise: t.StdIsLib['promise'];

  /** Wait for the promise to complete if the value is a promise; otherwise resolve immediately. */
  maybeWait<T>(value: T | Promise<T>): Promise<T>;

  /** Semaphore (concurrency limiter): cap concurrent promise tasks at `max` (extra tasks wait). */
  semaphore: t.Semaphore;
};

/**
 * Wait for the promise to complete if the given value
 * is a promise; otherwise resolve immediately.
 */
export type MaybeWait = <T>(value: T | Promise<T>) => Promise<T>;

/**
 * Semaphore (concurrency limiter): cap concurrent promise tasks at `max` (extra tasks wait).
 */
export type Semaphore = (max: number) => <T>(fn: () => Promise<T>) => Promise<T>;
