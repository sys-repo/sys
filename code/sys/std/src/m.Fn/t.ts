/**
 * Small, composable helpers for function calls.
 */
export type FnLib = {
  /**
   * Return a wrapper that runs the function at most once.
   *
   * - If the function returns a value, the first value is cached and returned thereafter.
   * - If the function returns void, subsequent calls are no-ops.
   * - If the function returns a Promise, the first Promise is cached and returned thereafter.
   *
   * Preserves parameter and return types of `fn`.
   */
  onceOnly<A extends readonly unknown[], R>(fn: (...a: A) => R): (...a: A) => R;
};
