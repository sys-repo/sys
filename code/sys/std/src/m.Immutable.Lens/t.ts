import type { t } from './common.ts';

type PathInput = t.ObjectPath | undefined | null;

/**
 * Root entry point for creating lenses over an `Immutable<T>` document.
 *
 * @example Value typing (V) with inferred T/P from `doc`
 * const msg = Lens.at<string>(doc, ['foo','msg']);
 *
 * @example Root (empty path)
 * const root = Lens.at(doc);
 */
export type LensLib = {
  at<V = unknown, T = unknown, P = unknown>(
    doc: t.Immutable<T, P>,
    ...path: PathInput[]
  ): Lens<T, P, V>;
};

/**
 * Lens<V>: binds an Immutable<T> + ObjectPath and forwards to Obj.Path + Immutable.change.
 * No events, no instance ID — just reads and immutable writes.
 */
export type Lens<T = unknown, P = unknown, V = unknown> = {
  readonly doc: t.Immutable<T, P>;
  readonly path: t.ObjectPath;

  /** Read current value at the path. */
  get(): V | undefined;

  /** Read with default. */
  getOr<D extends t.NonUndefined<V>>(def: D): V | D;

  /** True if a value is present (even if falsy). */
  exists(): boolean;

  /**
   * Set value immutably via doc.change.
   * Semantics: per Obj.Path.Mutate.set, setting `undefined` deletes the key.
   */
  set(value: V): void;

  /** Map current value → next value within one immutable change. */
  update(map: (curr: V | undefined) => V): void;

  /** Ensure the value exists (writes if undefined) and return it. */
  ensure<D extends t.NonUndefined<V>>(def: D): V | D;

  /** Delete the value (no-op if absent). */
  delete(): void;

  /** Derive a child lens at a sub-path. */
  child<U = unknown>(sub: PathInput): Lens<T, P, U>;

  /** Re-type the viewed value (compile-time only). */
  as<U>(): Lens<T, P, U>;

  /**
   * Create a new lens by appending one or more ObjectPath segments.
   * Equivalent to `child(Obj.Path.join(...segments))`, but supports passing
   * multiple path arrays that will be joined in order.
   *
   * @example
   * const base = Lens.at(doc, ['user']);
   * const name = base.at<string>(['profile'], ['displayName']);
   */
  at<U = unknown>(...segments: PathInput[]): Lens<T, P, U>;
};
