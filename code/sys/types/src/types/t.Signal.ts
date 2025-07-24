import type { ReadonlySignal, Signal } from '@preact/signals-core';
export { ReadonlySignal, Signal };

/**
 * Extracts the payload type carried by a **single** `Signal<...>`.
 * (Unlike `SignalValue`, this is *shallow*—it peels off only the
 * outermost Signal layer.)
 *
 * @example
 * ```ts
 * const mySignal = Signal.create<'Foo' | 'Bar'>('Foo');
 * type T = ExtractSignalValue<typeof mySignal>; // 'Foo' | 'Bar'
 * ```
 */
export type SignalValue<T> = T extends Signal<infer U> ? U : never;

/**
 * Recursively removes every `Signal<...>` wrapper from **T**,
 * returning the underlying plain values while leaving
 * functions and primitives unchanged.
 *
 *  -  Deep-unwraps arrays, tuples, and objects
 *  -  Callable types (`(...args) => any`) are passed through as-is
 *
 * @example
 * ```ts
 *    type Raw = Signal<number>;           // ← Signal<number>
 *    type A   = SignalValue<Raw>;         // ← number
 *
 *    type B = SignalValue<{
 *      foo: Signal<string>;
 *      bar: [Signal<boolean>, () => void];
 *    }>; // { foo: string; bar: [boolean, () => void] }
 * ```
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
 * Recursively wraps every non-function, non-Signal leaf inside **T**
 * in a `Signal<...>`, preserving tuple/array shape and marking the
 * resulting containers as `readonly`.
 *
 *  - Deep-wraps arrays, tuples, and objects
 *  - Callable types (`(...args) => any`) are passed through as-is
 *  - Already-wrapped values stay as-is (no double wrapping)
 *
 * @example
 * ```ts
 *   type Foo = {
 *     msg?: string;
 *     count: number;
 *   };
 *
 *   type FooSignals = WrapSignals<Foo>;
 *   // ↑
 *   // Readonly<{
 *   //   msg: Signal<string | undefined>;
 *   //   count: Signal<number>;
 *   // }>
 * ```
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
    : // 4. Handle standard mutable arrays (`readonly` result).
    T extends Array<infer U>
    ? ReadonlyArray<WrapSignals<U>>
    : // 5. Recurse into plain objects (`readonly` result).
    T extends object
    ? Readonly<{ [K in keyof T]-?: WrapSignals<T[K]> }>
    : // 6. Primitive or unknown leaf → wrap in a Signal.
      Signal<T>;
