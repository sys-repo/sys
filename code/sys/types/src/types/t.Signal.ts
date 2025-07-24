import type { ReadonlySignal, Signal } from '@preact/signals-core';
export { ReadonlySignal, Signal };

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
 *    type Raw = Signal<number>;                     // Signal<number>
 *    type A   = SignalValue<Raw>;                   // number
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
