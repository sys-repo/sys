import type { t } from './common.ts';

type O = Record<string, unknown>;

/**
 * Curried object-path wrapper API.
 */
export type CurriedPathLib = {
  /** Create a new curried-path instance for the given path: */
  create<T = unknown>(path: t.ObjectPath): CurriedPath<T>;
};

/**
 * The standard read/mutate API for a single curried object-path value.
 */
export type CurriedPath<T = unknown> = {
  /** The curried path. */
  readonly path: t.ObjectPath;

  /**
   * Deep-get helper with overloads so the return type
   * is `T | undefined` unless you pass a default value.
   */
  get(subject: O | undefined): T | undefined;
  get(subject: O | undefined, defaultValue: t.NonUndefined<T>): T;

  /**
   * Determine if the given path exists on the subject, irrespective of value.
   */
  exists(subject: O | undefined): boolean;

  /**
   * Deep-set helper that mutates `subject` setting a nested value at the path.
   *  - Creates intermediate objects/arrays as needed.
   *  - If `value` is `undefined`, the property is removed via [delete] rather than assigned `undefined`.
   */
  set(subject: O, value: T): t.ObjDiffOp | undefined;

  /**
   * Ensure a value at the path exists (not undefined),
   * and if not assigns the given default.
   */
  ensure(subject: O, defaultValue: t.NonUndefined<T>): T;

  /**
   * Deletes the value at the given path if it exists.
   */
  delete(subject: O): t.ObjDiffOp | undefined;

  /**
   * Creates a new curried path combining this path as the root
   * and the given sub-path.
   */
  join<T = unknown>(subpath: t.ObjectPath): CurriedPath<T>;
};
