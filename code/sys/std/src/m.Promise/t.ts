import type { t } from './common.ts';

/**
 * Tools for working with promises.
 */
export type PromiseLib = {
  /**
   * Determine if the value is a Promise.
   */
  isPromise: t.CommonIsLib['promise'];

  /**
   * Wait for the promise to complete if the given value
   * is a promise, other wise immediate resposne.
   */
  maybeWait<T>(value: T | Promise<T>): Promise<T>;
};

/**
 * Wait for the promise to complete if the given value
 * is a promise, other wise immediate resposne.
 */
export type MaybeWait = <T>(value: T | Promise<T>) => Promise<T>;
