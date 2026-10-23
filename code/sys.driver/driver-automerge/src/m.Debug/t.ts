/**
 * Automerge debug helper contracts.
 */
export declare namespace Debug {
  /** Public API for Automerge debug helpers. */
  export type Lib = {
    /** Re-entrancy sentinel. */
    Reentry: Reentry.Lib;

    /** DEV: monkey-patch Automerge.getHeads to warn during Automerge callbacks. */
    installTripwireGetHeads(enable: boolean): void;

    /** Schedule work on the next microtask. */
    defer(fn: () => void): void;

    /** Returns a scheduler that coalesces multiple calls into one microtask. */
    coalesce(): Scheduler;

    /** Read heads immediately; throws if called during an Automerge callback. */
    getHeadsSafe(doc: unknown): Heads;

    /** Read heads on the next microtask and invoke the callback with the result. */
    getHeadsDeferred(doc: unknown, use: (heads: Heads) => void): void;

    /** DEV: wrap a doc/ref so accessing it during an Automerge callback throws. */
    guardDocAccess<T>(doc: T): T;
  };

  /** Microtask-coalescing scheduler. */
  export type Scheduler = (fn: () => void) => void;

  /** Automerge document heads. */
  export type Heads = readonly string[];

  /**
   * Re-entrancy guard contracts.
   */
  export namespace Reentry {
    /** Re-entrancy guard API. */
    export type Lib = {
      /** Mark a region as inside an Automerge callback for the duration of `fn`. */
      enter<T>(label: string, fn: () => T): T;

      /** True if the current stack is inside an Automerge callback region. */
      inCallback(): boolean;

      /** LIFO labels for nested `enter` regions. */
      labels(): readonly string[];
    };
  }
}
