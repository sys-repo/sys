import type { ReadonlySignal, Signal } from '@preact/signals-core';
export { ReadonlySignal, Signal };

/**
 * Extracts the payload type carried by a **single** `Signal<...>`.
 */
export type SignalValue<T> = T extends Signal<infer U> ? U : never;

/**
 * Recursively strips every `Signal<...>` wrapper from **T**.
 */
export type UnwrapSignals<T> = T extends Signal<infer U>
  ? U
  : T extends (...args: any[]) => any
  ? T
  : T extends readonly [unknown, ...unknown[]]
  ? { [K in keyof T]: UnwrapSignals<T[K]> }
  : T extends object
  ? { [K in keyof T]: UnwrapSignals<T[K]> }
  : T;

/**
 * Recursively wraps every non-function, non-Signal leaf inside <T>
 * in a `Signal<...>`, preserving tuple/array shape.
 */
export type WrapSignals<T> =
  // 1. Leave existing Signal instances untouched.
  T extends Signal<any>
    ? T
    : // 2. Pass functions through unchanged.
    T extends (...args: any[]) => any
    ? T
    : // 3. Handle tuples (fixed-length readonly arrays).
    T extends readonly [unknown, ...unknown[]]
    ? Readonly<{ [K in keyof T]: WrapSignals<T[K]> }>
    : // Treat all non-tuple arrays as atomic leaves.
    T extends readonly any[]
    ? Signal<T>
    : // 4. (legacy) Standard mutable arrays (kept for backward compat).
    T extends Array<infer U>
    ? ReadonlyArray<WrapSignals<U>>
    : // 5. Recurse into plain objects (`readonly` result).
    T extends object
    ? Readonly<{ [K in keyof T]-?: WrapSignals<T[K]> }>
    : // 6. Primitive or unknown leaf → wrap in a Signal.
      Signal<T>;
