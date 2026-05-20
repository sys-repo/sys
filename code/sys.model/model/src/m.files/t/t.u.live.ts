import type { Runtime } from './t.u.runtime.ts';

/**
 * Live Files backing surfaces.
 */
export declare namespace Live {
  /** Runtime shape shared by live Files backing adapters. */
  export type Shape<K extends string> = Runtime.Shape<K> & {
    /** Read-only live backing diagnostics; not Files authority. */
    readonly diagnostics: Diagnostics;
  };

  /** Read-only diagnostics for deterministic live backing orchestration/tests. */
  export type Diagnostics = {
    /** Number of currently active `files:watch` subscriptions. */
    readonly activeWatchCount: () => number;

    /** Resolve when at least one `files:watch` subscription is active. */
    readonly whenWatchActive: () => Promise<void>;
  };
}
