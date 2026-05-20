import type { BackingRuntime } from './t.backing.runtime.ts';

/**
 * Live Files backing surfaces.
 */
export declare namespace BackingLive {
  /** Runtime shape shared by live Files backing adapters. */
  export type Runtime<K extends string> = BackingRuntime.Runtime<K> & {
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
