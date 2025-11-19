import type { t } from './common.ts';

/**
 * Lazy memoization primitives.
 */
export type LazyLib = {
  /**
   * Wrap a computation in a lazy memo cell.
   *
   * @param compute  Pure function executed on first access.
   * @param opts     Optional reset triggers.
   *   - reset$: observable whose emissions invalidate the cache.
   */
  memo<T>(compute: () => T, opts?: LazyMemoOptions | t.Observable<unknown>): LazyMemo<T>;
};

/**
 * Options for memoised lazy cells.
 */
export type LazyMemoOptions = {
  /**
   * External reset trigger.
   * Any next() emission invalidates the cached value.
   */
  readonly reset$?: t.Observable<unknown>;
};

/**
 * A memoised lazy value:
 * - Callable: invoking the function returns the cached value.
 * - `.value`: getter form of the same.
 * - `.reset()`: drop the cache; next call recomputes.
 */
export type LazyMemo<T> = {
  (): T;
  readonly value: T;
  reset(): void;
};
