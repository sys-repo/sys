import type { t } from './common.ts';

/** Extracts a union of all nested `Signal` value types contained within `T`. */
export type SignalValueOf<T> = T extends t.Signal<infer S>
  ? S
  : T extends (infer U)[]
  ? SignalValueOf<U>
  : T extends object
  ? { [K in keyof T]: SignalValueOf<T[K]> }[keyof T]
  : never;

/** Visitor payload describing a discovered `Signal` during traversal. */
export type SignalWalkEntry<S = unknown> = {
  readonly parent: object | any[];
  readonly path: t.ObjectPath;
  readonly key: string | number;
  readonly signal: t.ReadonlySignal<S>;
  readonly value: S;
  stop(): void;
  mutate(value: S): void;
};

/** Visitor function invoked for each `Signal` found while walking. */
export type SignalWalkFn<S = unknown> = (e: SignalWalkEntry<S>) => void;

/** Options controlling traversal/apply behavior (e.g., skipping `undefined`). */
export type SignalWalkOptions = {
  skipUndefined?: boolean;
};

/**
 * Walks an object tree (recursive descent) and invokes `fn` for each Signal found.
 * Returns the number of visited signals.
 */
export type SignalWalk = <T extends object | any[]>(
  parent: T,
  fn: SignalWalkFn<SignalValueOf<T>>,
  options?: SignalWalkOptions,
) => number;
