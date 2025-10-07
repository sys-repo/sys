/** Microtask-coalescing scheduler. */
export type Scheduler = (fn: () => void) => void;

/** Automerge document heads. */
export type Heads = readonly string[];

/**
 * Public API for Automerge debug helpers:
 * re-entrancy detection, safe scheduling, guarded doc access.
 */
export type DebugLib = {
  /** Re-entrancy sentinel: marks Automerge-driven callbacks and exposes in-stack state. */
  Reentry: DebugReentryLib;

  /** DEV: monkey-patch Automerge.getHeads to warn when called inside an Automerge callback. */
  installTripwireGetHeads(enable: boolean): void;

  /** Schedule work on the next microtask (single-shot). */
  defer(fn: () => void): void;

  /** Returns a scheduler that coalesces multiple calls into a single microtask. */
  coalesce(): Scheduler;

  /** Read heads immediately; throws if called during an Automerge callback. */
  getHeadsSafe(doc: unknown): Heads;

  /** Read heads on the next microtask and invoke the callback with the result. */
  getHeadsDeferred(doc: unknown, use: (heads: Heads) => void): void;

  /** DEV: wrap a doc/ref so accessing it during an Automerge callback throws (boundary guard). */
  guardDocAccess<T>(doc: T): T;
};

/**
 * Re-entrancy guard API.
 */
export type DebugReentryLib = {
  /** Mark a region as inside an Automerge callback for the duration of `fn`. */
  enter<T>(label: string, fn: () => T): T;

  /** True if the current stack is inside an Automerge callback region. */
  inCallback(): boolean;

  /** LIFO labels for nested `enter` regions (dev diagnostics). */
  labels(): readonly string[];
};
