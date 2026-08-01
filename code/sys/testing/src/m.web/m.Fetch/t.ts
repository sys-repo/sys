import type { t } from './common.ts';

/**
 * Fetch global test fixtures.
 */
export declare namespace WebFixtureFetch {
  /** Runtime library surface for Fetch test fixtures. */
  export type Lib = {
    /** Replace `globalThis.fetch` until the returned handle is disposed. */
    mock: MockFactory;
  };

  /** Factory for lifecycle-scoped replacement of `globalThis.fetch`. */
  export type MockFactory = (replacement: t.Fetch) => Mock;

  /** Active Fetch mock handle with exact, idempotent, retryable restoration. */
  export type Mock = t.DisposableLike;
}
