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
    /** Diagnostics for active live subscriptions. */
    readonly Active: ActiveDiagnostics;
  };

  /** Diagnostics for active live subscriptions. */
  export type ActiveDiagnostics = {
    /** Number of currently active `files:watch` subscriptions. */
    readonly watchCount: () => number;

    /** Resolve when at least one `files:watch` subscription is active. */
    readonly whenActive: () => Promise<void>;
  };
}
